/**
 * @module pdf
 */

import * as stencila from '@stencila/schema'
import { PDFDocument, PDFName, PDFStream } from 'pdf-lib'
import { dump, load } from '../..'
import bundle from '../../util/bundle'
import * as puppeteer from '../../util/puppeteer'
import * as vfile from '../../util/vfile'
import * as xml from '../../util/xml'
import { Codec, GlobalEncodeOptions } from '../types'

export class PDFCodec extends Codec implements Codec {
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
  public readonly decode = async (
    file: vfile.VFile
  ): Promise<stencila.Node> => {
    const buffer = await vfile.dump(file, 'buffer')
    const pdf = await PDFDocument.load(buffer)

    // Attempt to extract the entire node from XMP metadata
    const node = await decodeXmp(pdf)
    if (node !== undefined) return node

    // Fallback to extracting meta-data from info dict
    const { title = 'Untitled', authors = [] } = decodeInfoDict(pdf)
    return stencila.article(authors, title)
  }

  /**
   * Encode a Stencila `Node` to a `VFile` with PDF content.
   *
   * @param node The Stencila `Node` to encode
   * @param filePath The file system path to write the PDF to
   * @returns A promise that resolves to a `VFile`
   */
  public readonly encode = async (
    node: stencila.Node,
    options: GlobalEncodeOptions = this.defaultEncodeOptions
  ): Promise<vfile.VFile> => {
    // Generate HTML that will be used to render the PDF
    // Bundle images into HTML, otherwise Puppeteer will not
    // load them
    const html = await dump(node, 'html', {
      ...options,
      isBundle: true
    })

    // Render the PDF in the browser
    const page = await puppeteer.page()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const buffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      scale: 0.85,
      margin: {
        top: '2.54cm',
        bottom: '2.54cm',
        left: '2.54cm',
        right: '2.54cm'
      }
    })
    await page.close()

    // Add meta-data to the PDF
    const pdf = await PDFDocument.load(buffer)
    encodeInfoDict(pdf, node)
    await encodeXmp(pdf, node)
    const bytes = await pdf.save()

    return vfile.load(Buffer.from(bytes))
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
async function decodeXmp(pdf: PDFDocument): Promise<stencila.Node | undefined> {
  const metadata = pdf.catalog.lookup(PDFName.of('Metadata'), PDFStream)
  if (metadata === undefined) return

  const xmpContent = metadata.getContentsString()
  const xmp = xml.load(xmpContent, { compact: false }) as xml.Element
  const source = xml.first(xmp, 'stencila:source')
  if (source === null) return

  const cdata =
    source.elements && source.elements[0] && source.elements[0].cdata
  if (cdata === undefined) return

  const node = await load(cdata, 'json')
  return node
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
async function encodeXmp(pdf: PDFDocument, node: stencila.Node): Promise<void> {
  let title
  let authors
  let keywords

  if (stencila.isCreativeWork(node)) {
    ;({ title, authors, keywords } = node)
  }

  let subject
  let producer

  const createDate = new Date()
  const modifyDate = new Date()

  const source = await dump(node, 'json')

  const whitespacePadding = new Array(20).fill(' '.repeat(100)).join('\n')
  const metadataXML = `
    <?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
      <x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="Adobe XMP Core 5.2-c001 63.139439, 2010/09/27-13:37:26        ">
        <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">

          <rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/">
            <dc:format>application/pdf</dc:format>
            <dc:creator>
              <rdf:Seq>
                <rdf:li>${authors}</rdf:li>
              </rdf:Seq>
            </dc:creator>
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
                  .map(keyword => `<rdf:li>${keyword}</rdf:li>`)
                  .join('\n')}
              </rdf:Bag>
            </dc:subject>`
            }
          </rdf:Description>

          <rdf:Description rdf:about="" xmlns:pdf="http://ns.adobe.com/pdf/1.3/">
            <pdf:Subject>${subject}</pdf:Subject>
            <pdf:Producer>${producer}</pdf:Producer>
          </rdf:Description>

          <rdf:Description rdf:about="" xmlns:xmp="http://ns.adobe.com/xap/1.0/">
            <xmp:CreatorTool>${creatorTool}</xmp:CreatorTool>
            <xmp:CreateDate>${createDate.toISOString()}</xmp:CreateDate>
            <xmp:ModifyDate>${modifyDate.toISOString()}</xmp:ModifyDate>
            <xmp:MetadataDate>${new Date().toISOString()}</xmp:MetadataDate>
          </rdf:Description>

        </rdf:RDF>
        <stencila:source xmlns:stencila="http://ns.stenci.la">
          <![CDATA[${source}]]>
        </stencila:source>
      </x:xmpmeta>
      ${whitespacePadding}
    <?xpacket end="w"?>
  `.trim()

  const metadataStream = pdf.context.stream(metadataXML, {
    Type: 'Metadata',
    Subtype: 'XML',
    Length: metadataXML.length
  })
  const metadataStreamRef = pdf.context.register(metadataStream)
  pdf.catalog.set(PDFName.of('Metadata'), metadataStreamRef)
}

/**
 * Extract legacy "Document Information Dictionary" fields from a PDF.
 *
 * @param pdf The PDF document to extract metadata from
 */
function decodeInfoDict(pdf: PDFDocument): any {
  // @ts-ignore that getInfoDict is private
  const info = pdf.getInfoDict()
  const title = info.get(PDFName.of('Title')).toString()
  // TODO finish
  return {
    title
  }
}

/**
 * Add legacy "Document Information Dictionary" fields to a PDF.
 * These fields that are visible in the "Document Properties" section of most PDF readers.
 *
 * @param pdf The PDF document to add meta data to
 * @param node The node from which metadata will taken
 */
function encodeInfoDict(pdf: PDFDocument, node: stencila.Node): void {
  let title, authors, keywords, datePublished
  if (stencila.isCreativeWork(node)) {
    ;({ title, authors, keywords, datePublished } = node)
  }

  if (title !== undefined) {
    if (typeof title === 'string') pdf.setTitle(title)
    // TODO: handle an array of nodes here
  }
  // TODO: implement similar logic for these fields
  // pdf.setAuthor()
  // pdf.setSubject(subject)
  // pdf.setKeywords(['eggs', 'wall', 'fall', 'king', 'horses', 'men'])

  pdf.setCreator(creatorTool)
  // TODO: convert publication date
  // pdf.setCreationDate(datePublished)
  pdf.setModificationDate(new Date())
}
