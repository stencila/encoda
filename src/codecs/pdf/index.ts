/**
 * [[include:src/codecs/pdf/README.md]]
 *
 * @module codecs/pdf
 */
import { getLogger } from '@stencila/logga'
import { schema } from '@stencila/jesta'
import { PDFDocument, PDFName, PDFStream } from 'pdf-lib'
import { dump, load } from '../..'
import * as puppeteer from '../../util/puppeteer'
import * as vfile from '../../util/vfile'
import * as xml from '../../util/xml'
import { HTMLCodec } from '../html'
import { TxtCodec } from '../txt'
import { Codec, CommonEncodeOptions } from '../types'
import { decodeDoc as decodeXmlDoc, encodeDoc as encodeXmlDoc } from '../xml'

const htmlCodec = new HTMLCodec()

const log = getLogger('encoda:pdf')

export class PdfCodec extends Codec {
  /**
   * The media types that this codec can decode/encode.
   */
  public readonly mediaTypes = ['application/pdf']

  /**
   * Decode a PDF file to a Stencila `Node`.
   *
   * Usually the decoded node will be an `Article`.
   * However, due to the way that this codec embeds
   * nodes in PDFs, it could be any node type, including a
   * `Datatable` or even a `number`.
   *
   * @param file The PDF file to decode
   * @returns A promise that resolves to a `Node`
   */
  public readonly decode = async (file: vfile.VFile): Promise<schema.Node> => {
    const buffer = await vfile.dump(file, 'buffer')
    const pdf = await PDFDocument.load(new Uint8Array(buffer))

    // Attempt to extract the entire node from XMP metadata
    const node = await decodeXmp(pdf)
    if (node !== undefined) return node

    // Fallback to extracting meta-data from info dict
    log.warn('PDF file does not appear to be a Reproducible-PDF')
    const meta = decodeInfoDict(pdf)
    const {
      title,
      authors,
      keywords,
      dateCreated,
      dateModified,
    } = await decodeMetadata(meta)
    return schema.creativeWork({
      authors,
      title,
      keywords,
      dateCreated,
      dateModified,
    })
  }

  /**
   * Encode a Stencila `Node` to a `VFile` with PDF content.
   *
   * @param node The Stencila `Node` to encode
   * @param filePath The file system path to write the PDF to
   * @returns A promise that resolves to a `VFile`
   */
  public readonly encode = async (
    node: schema.Node,
    options: CommonEncodeOptions = this.commonEncodeDefaults
  ): Promise<vfile.VFile> => {
    // Generate HTML that will be used to render the PDF.
    // Standalone: so that the theme option is respected.
    // Bundle: because Puppeteer will not load local (e.g. `/tmp`) files.
    // Other options e.g. themes are passed through
    const html = await htmlCodec.dump(node, {
      ...options,
      isStandalone: true,
      isBundle: true,
    })

    // Render the PDF in the browser
    // Use extra styles to hide chrome from web components
    const page = await puppeteer.page()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    await page.addStyleTag({
      content: `
      stencila-code-chunk stencila-code-editor,
      stencila-code-chunk stencila-action-menu {
        display: none !important;
      }
    `,
    })
    const buffer = await page.pdf({
      format: 'a4',
      printBackground: true,
      scale: 0.85,
      margin: {
        top: '2.54cm',
        bottom: '2.54cm',
        left: '2.54cm',
        right: '2.54cm',
      },
    })
    await page.close()

    // Add meta-data to the PDF
    const pdf = await PDFDocument.load(new Uint8Array(buffer))
    const metadata = await encodeMetadata(node)
    encodeInfoDict(pdf, metadata)
    encodeXmp(pdf, metadata, node)
    const bytes = await pdf.save()

    return vfile.load(Buffer.from(bytes))
  }
}

interface PdfMetadata {
  title?: string
  authors?: string[]
  keywords?: string[]
  dateCreated?: Date
  dateModified?: Date
  dateCurrent?: Date
}

/**
 * Decode PDF metadata to a `CreativeWork`.
 */
const decodeMetadata = async (
  metadata: PdfMetadata
  // eslint-disable-next-line @typescript-eslint/require-await
): Promise<schema.CreativeWork> => {
  const { title, authors, keywords, dateCreated, dateModified } = metadata

  let people
  if (authors !== undefined) {
    people = await Promise.all(
      authors.map(
        async (author) => load(author, 'person') as Promise<schema.Person>
      )
    )
  }
  return schema.creativeWork({
    title,
    authors: people,
    keywords,
    dateCreated:
      dateCreated !== undefined
        ? schema.date({ value: dateCreated.toISOString() })
        : undefined,
    dateModified:
      dateModified !== undefined
        ? schema.date({ value: dateModified.toISOString() })
        : undefined,
  })
}

/**
 * Encode PDF metadata in a `Node` in the form handled by
 * either XMP or PDF info dict.
 */
const encodeMetadata = async (node: schema.Node): Promise<PdfMetadata> => {
  let title
  let authors
  let keywords
  let dateCreated
  let dateModified
  const dateCurrent = new Date()
  if (schema.isCreativeWork(node)) {
    ;({ title, authors, keywords, dateCreated, dateModified } = node)
  }

  if (title !== undefined) {
    title = typeof title === 'string' ? title : TxtCodec.stringify(title)
  }

  if (authors !== undefined) {
    authors = await Promise.all(
      authors.map((author) => {
        if (schema.isA('Person', author)) return dump(author, 'person')
        else return author.name ?? author.legalName ?? ''
      })
    )
  }

  dateCreated =
    dateCreated !== undefined
      ? new Date(
          typeof dateCreated === 'string' ? dateCreated : dateCreated.value
        )
      : dateCurrent
  dateModified =
    dateModified !== undefined
      ? new Date(
          typeof dateModified === 'string' ? dateModified : dateModified.value
        )
      : dateCurrent

  return {
    title,
    authors,
    keywords,
    dateCreated,
    dateModified,
    dateCurrent,
  }
}

const creatorTool = 'Stencila Encoda https://github.com/stencila/encoda'

/**
 * Decode XMP metadata as a Stencila `Node`.
 *
 * This function only attempts to extract a `Node` from XMP
 * It does not attempt to extract other meta data e.g. `dc:title`.
 * If it is unable to extract a `Node` it returns `undefined`.
 *
 * @param pdf The PDF document to decode XMP metadata from
 */
function decodeXmp(pdf: PDFDocument): Promise<schema.Node | void> {
  let metadata
  try {
    metadata = pdf.catalog.lookup(PDFName.of('Metadata'), PDFStream)
    if (metadata === undefined) return Promise.resolve()
  } catch {
    return Promise.resolve()
  }

  const xmpContent = metadata.getContentsString()
  const xmp = xml.load(xmpContent)
  return Promise.resolve(decodeXmlDoc(xmp))
}

/**
 * Encode a Stencila `Node` as XMP metadata.
 *
 * This function encodes the node as XMP using two approaches:
 *
 * - it's properties as standard metadata elements e.g `dc:title` (for use by other PDF readers)
 * - the entire node as `stencila:source` (for use by this codec when decoding)
 *
 * @see https://github.com/Hopding/pdf-lib/issues/55#issuecomment-527447921
 *
 * @param pdf The PDF document to add XMP metadata to
 * @param node The node to encode
 */
function encodeXmp(
  pdf: PDFDocument,
  meta: PdfMetadata,
  node: schema.Node
): void {
  const {
    title,
    authors,
    keywords,
    dateCreated,
    dateModified,
    dateCurrent,
  } = meta

  // Dump the entire node as an XML document to put into XMP
  const nodeDoc = encodeXmlDoc(node)
  const nodeXML = xml.dump(nodeDoc)

  /**
   * Whitespace padding is recommended by the PDF spec
   * so that additional metadata can be added later without
   * having to change the byte offset of other objects in the document.
   */
  const whitespacePadding = new Array(20).fill(' '.repeat(100)).join('\n')

  const metadataXML = `
    <?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
      <x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="Adobe XMP Core 5.2-c001 63.139439, 2010/09/27-13:37:26        ">
        <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">

          <rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/">
            <dc:format>application/pdf</dc:format>
            ${
              authors === undefined
                ? ''
                : `<dc:creator>
              <rdf:Seq>
                ${authors
                  .map((author) => `<rdf:li>${author}</rdf:li>`)
                  .join('\n')}
              </rdf:Seq>
            </dc:creator>`
            }
            <dc:title>
               <rdf:Alt>
                  <rdf:li xml:lang="x-default">${title}</rdf:li>
               </rdf:Alt>
            </dc:title>
            ${
              keywords === undefined
                ? ''
                : `<dc:subject>
              <rdf:Bag>
                ${keywords
                  .map((keyword) => `<rdf:li>${keyword}</rdf:li>`)
                  .join('\n')}
              </rdf:Bag>
            </dc:subject>`
            }
          </rdf:Description>

          <rdf:Description rdf:about="" xmlns:xmp="http://ns.adobe.com/xap/1.0/">
            <xmp:CreatorTool>${creatorTool}</xmp:CreatorTool>
            <xmp:CreateDate>${dateCreated}</xmp:CreateDate>
            <xmp:ModifyDate>${dateModified}</xmp:ModifyDate>
            <xmp:MetadataDate>${dateCurrent}</xmp:MetadataDate>
          </rdf:Description>

        </rdf:RDF>
        ${nodeXML}
      </x:xmpmeta>
      ${whitespacePadding}
    <?xpacket end="w"?>
  `.trim()

  const metadataStream = pdf.context.stream(metadataXML, {
    Type: 'Metadata',
    Subtype: 'XML',
    Length: metadataXML.length,
  })
  const metadataStreamRef = pdf.context.register(metadataStream)
  pdf.catalog.set(PDFName.of('Metadata'), metadataStreamRef)
}

/**
 * Extract legacy "Document Information Dictionary" fields from a PDF.
 *
 * @param pdf The PDF document to extract metadata from
 */
function decodeInfoDict(pdf: PDFDocument): PdfMetadata {
  // @ts-ignore that getInfoDict is private
  const info = pdf.getInfoDict()
  const extractValue = (name: string): string | undefined => {
    const value = info.get(PDFName.of(name)).toString()
    if (value === undefined) return
    if (value[0] === '(' && value[value.length - 1] === ')')
      return value.slice(1, -1)
    return value
  }
  const title = extractValue('Title')
  const authors = extractValue('Author')
  const keywords = extractValue('Keywords')
  const extractDate = (name: string): Date | undefined => {
    const str = extractValue(name)
    if (str === undefined) return
    const match = /D:(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})Z/.exec(str)
    if (match === null) return
    const iso = `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}Z`
    try {
      return new Date(iso)
    } catch {}
  }
  const dateCreated = extractDate('CreationDate')
  const dateModified = extractDate('ModDate')
  return {
    title,
    authors: authors !== undefined ? authors.split(',') : undefined,
    keywords: keywords !== undefined ? keywords.split(/\s+/) : undefined,
    dateCreated,
    dateModified,
  }
}

/**
 * Add legacy "Document Information Dictionary" fields to a PDF.
 * These fields that are visible in the "Document Properties" section of most PDF readers.
 *
 * @param pdf The PDF document to add meta data to
 * @param node The node from which metadata will taken
 */
function encodeInfoDict(pdf: PDFDocument, meta: PdfMetadata): void {
  const { title, authors, keywords, dateCreated, dateModified } = meta
  if (title !== undefined) pdf.setTitle(title)
  if (authors !== undefined) pdf.setAuthor(authors.join(', '))
  if (keywords !== undefined) pdf.setKeywords(keywords)
  if (dateCreated !== undefined) pdf.setCreationDate(dateCreated)
  if (dateModified !== undefined) pdf.setModificationDate(dateModified)
  pdf.setCreator(creatorTool)
}
