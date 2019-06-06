/**
 * A codec for Google Documents (GDoc).
 *
 * This codec decodes from, and encodes to, the GDoc JSON ('application/vnd.google-apps.document')
 * as defined as [JSON Schemas here](https://docs.googleapis.com/$discovery/rest?version=v1) and in
 * [Typescript here](https://github.com/googleapis/google-api-nodejs-client/blob/master/src/apis/docs/v1.ts)
 *
 * See also the [guide on the structure](https://developers.google.com/docs/api/concepts/structure)
 * of a GDoc.
 *
 * It is possible to get this JSON using the Google Docs API [`get`](https://developers.google.com/docs/api/reference/rest/v1/documents/get) method.
 * However, it is not possible to `POST` i.e. upload the JSON. The [`create`](https://developers.google.com/docs/api/reference/rest/v1/documents/create) method
 * only creates a **blank** document:
 *
 * > Creates a blank document using the title given in the request.
 * > Other fields in the request, **including any provided content, are ignored**.
 *
 * There are two other possibilities for creating a GDoc from content:
 *
 * 1. Use the Google Drive API [`import` method](https://developers.google.com/drive/api/v3/manage-uploads#import_to_google_docs_types_) to upload content such as HTML.
 * 2. Use Google [App Script API](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/google-apps-script/google-apps-script.document.d.ts)
 *    to walk Stencila JSON and build up the GDoc by calling methods such as `Body.appendParagraph` etc.
 */

import { getLogger } from '@stencila/logga'
import stencila from '@stencila/schema'
import axios from 'axios'
import crypto from 'crypto'
import fs from 'fs'
import { docs_v1 as GDoc } from 'googleapis'
import { Encode } from '.'
import type from './util/type'
import { dump, load, VFile } from './vfile'

const logger = getLogger('encoda')

export const mediaTypes = ['application/vnd.google-apps.document']

/**
 * Decode a `VFile` with `gdoc` contents to a `stencila.Node`.
 *
 * @param file The `VFile` to decode
 * @returns A promise that resolves to a `stencila.Node`
 */
export async function decode(
  file: VFile,
  fetch: boolean = true
): Promise<stencila.Node> {
  const json = await dump(file)
  const gdoc = JSON.parse(json)
  return decodeDocument(gdoc, fetch)
}

/**
 * Encode a `stencila.Node` to a `VFile` with Markdown contents.
 *
 * @param node The `stencila.Node` to encode
 * @returns A promise that resolves to a `VFile`
 */
export const encode: Encode = async (node: stencila.Node): Promise<VFile> => {
  const gdoc = encodeNode(node)
  const json = JSON.stringify(gdoc, null, '  ')
  return load(json)
}

/**
 * The GDoc currently being decoded from
 *
 * This is necessary as a context when decoding for retrieving properties
 * of list and images. We use a global object rather than having to pass
 * the reference to the document through all the function calls.
 */
let decodingGDoc: GDoc.Schema$Document

/**
 * The GDoc currently being encoded to
 *
 * @see decodingGDoc
 */
let encodingGDoc: GDoc.Schema$Document

/**
 * The function to use to fetch remote resources
 * during decoding. This allows us (a) to keep most of the decoding functions
 * synchronous and (b) turn off fetching during tests.
 */
let decodingFetcher: (url: string) => string

/**
 * Fetches a remote file to a local file
 */
class FetchToFile {
  requests: Promise<void>[] = []

  get(url: string, ext: string = ''): string {
    const filePath =
      crypto
        .createHash('md5')
        .update(url)
        .digest('hex') + ext
    const request = axios({
      url: url,
      responseType: 'stream'
    })
      .then(response => {
        response.data.pipe(fs.createWriteStream(filePath))
      })
      .catch(error => {
        logger.error(`Error when fetching ${url}: ${error.message}`)
      })
    this.requests.push(request)
    return filePath
  }

  async resolve(): Promise<void[]> {
    return Promise.all(this.requests)
  }
}

/**
 * A dummy fetcher, used in testing.
 */
class FetchToSame {
  get(url: string): string {
    return url
  }
  async resolve(): Promise<void> {
    return
  }
}

/**
 * Decode a GDoc `Document` to a Stencila `Article`
 *
 * Note that currently `TableOfContents` child elements are ignored.
 */
async function decodeDocument(
  doc: GDoc.Schema$Document,
  fetch: boolean
): Promise<stencila.Node> {
  decodingGDoc = doc

  // Create a fetcher for remove resources
  const fetcher = new (fetch ? FetchToFile : FetchToSame)()
  decodingFetcher = fetcher.get.bind(fetcher)

  let content: Array<stencila.Node> = []
  let lists: { [key: string]: stencila.List } = {}
  if (doc.body && doc.body.content) {
    content = doc.body.content
      .map((elem: GDoc.Schema$StructuralElement, index: number) => {
        if (elem.paragraph) return decodeParagraph(elem.paragraph, lists)
        else if (elem.sectionBreak) {
          // The first element in the content is always a sectionBreak, so ignore it
          return index === 0 ? undefined : decodeSectionBreak(elem.sectionBreak)
        } else if (elem.table) return decodeTable(elem.table)
        else {
          throw new Error(`Unhandled GDoc element type ${JSON.stringify(elem)}`)
        }
      })
      .filter(node => typeof node !== 'undefined') as Array<stencila.Node>
  }

  // Resolve the fetched resources
  await fetcher.resolve()

  return {
    type: 'Article',
    title: doc.title,
    authors: [],
    content
  }
}

/**
 * Encode a Stencila `Node` to a GDoc `Document`
 */
function encodeNode(node: stencila.Node): GDoc.Schema$Document {
  const gdoc: GDoc.Schema$Document = {
    title: 'Untitled',
    body: {
      content: [{ sectionBreak: {} }]
    },
    lists: {},
    inlineObjects: {}
  }
  encodingGDoc = gdoc
  const gdocContent = gdoc.body!.content!

  // Wrap the node as needed to ensure an array
  // of block element at the top level
  let content: stencila.Node[] = []
  switch (type(node)) {
    // `CreativeWork` types (have `content`)
    case 'Article':
      const article = node as stencila.Article
      gdoc.title = article.title || ''
      content = article.content || []
      break
    // `BlockContent` types
    case 'Heading':
    case 'Paragraph':
    case 'CodeBlock':
    case 'List':
    case 'Table':
    case 'ThematicBreak':
      content = [node]
      break
    // Everything else is wrapped into a `Paragraph`
    default:
      const para: stencila.Paragraph = {
        type: 'Paragraph',
        // TODO: avoid this use of `as`
        content: [node as stencila.InlineContent]
      }
      content = [para]
  }

  if (content) {
    for (let node of content) {
      const type_ = type(node)
      switch (type_) {
        case 'Heading':
          gdocContent.push(encodeHeading(node as stencila.Heading))
          break
        case 'Paragraph':
          gdocContent.push(encodeParagraph(node as stencila.Paragraph))
          break
        case 'CodeBlock':
          gdocContent.push(encodeCodeBlock(node as stencila.CodeBlock))
          break
        case 'List':
          gdocContent.push(...encodeList(node as stencila.List))
          break
        case 'Table':
          gdocContent.push(encodeTable(node as stencila.Table))
          break
        case 'ThematicBreak':
          gdocContent.push(encodeThematicBreak(node as stencila.ThematicBreak))
          break
        default:
          throw new Error(`Unhandled Stencila node type "${type_}"`)
      }
    }
  }
  return gdoc
}

/**
 * Decode a GDoc `Paragraph` to a Stencila `Paragraph`, `Heading` or `List` node.
 */
function decodeParagraph(
  para: GDoc.Schema$Paragraph,
  lists: { [key: string]: stencila.List }
): stencila.Paragraph | stencila.Heading | stencila.List | undefined {
  let content: any[] = []
  if (para.elements) {
    content = para.elements.map(node => decodeParagraphElement(node))
  }

  if (para.paragraphStyle) {
    let styleType = para.paragraphStyle.namedStyleType
    if (styleType) {
      let match = styleType.match(/^HEADING_(\d)$/)
      if (match) {
        return {
          type: 'Heading',
          depth: parseInt(match[1], 10),
          content
        }
      }
    }
  }

  if (para.bullet) return decodeList(para, content, lists)

  return {
    type: 'Paragraph',
    content
  }
}

/**
 * Encode a Stencila `Heading` to a GDoc `Paragraph` with a `HEADING_` style.
 */
function encodeHeading(
  heading: stencila.Heading
): GDoc.Schema$StructuralElement {
  const elem = encodeParagraph({
    type: 'Paragraph',
    content: heading.content
  })
  elem.paragraph!.paragraphStyle = {
    namedStyleType: `HEADING_${heading.depth}`
  }
  return elem
}

/**
 * Encode a Stencila `Paragraph` to a GDoc `Paragraph`.
 */
function encodeParagraph(
  para: stencila.Paragraph
): GDoc.Schema$StructuralElement {
  return {
    paragraph: {
      elements: para.content.map(encodeInlineContent)
    }
  }
}

/**
 * Encode a Stencila `CodeBlock` to a GDOC `Paragraph`.
 */
function encodeCodeBlock(
  block: stencila.CodeBlock
): GDoc.Schema$StructuralElement {
  return {
    paragraph: {
      elements: [
        {
          textRun: {
            content: block.value
          }
        }
      ]
    }
  }
}

/**
 * Decode a GDoc list item paragraph (one with a `bullet`) to
 * a Stencila `List`.
 *
 * @returns A new `List` or undefined if the paragraph was
 *        added to an existing list.
 */
function decodeList(
  para: GDoc.Schema$Paragraph,
  content: stencila.InlineContent[],
  lists: { [key: string]: stencila.List }
): stencila.List | undefined {
  const bullet = para.bullet!
  const listId = bullet.listId
  if (!listId) throw new Error('Woaah, the bullet has no list id!')
  // If there is already a list with this id then add this paragraph to it
  const existingList = lists[listId]
  if (existingList) {
    existingList.items.push({ type: 'Paragraph', content })
    return undefined
  }
  // Create a new list with this paragraph as it's first item
  if (!decodingGDoc.lists) throw new Error('WTF, the GDoc has no lists!')
  const list = decodingGDoc.lists[listId].listProperties
  if (!(list && list.nestingLevels)) {
    throw new Error('OMG! That list id can`t be found')
  }
  const level = list.nestingLevels[bullet.nestingLevel || 0]
  // It seems that the only way to tell if a list is ordered on unordered is to look at
  // the glyphType.
  // See https://developers.google.com/docs/api/reference/rest/v1/ListProperties#NestingLevel
  const order =
    typeof level.glyphType === 'undefined' ||
    level.glyphType === 'GLYPH_TYPE_UNSPECIFIED'
      ? 'unordered'
      : 'ascending'
  const newList: stencila.List = {
    type: 'List',
    order,
    items: [{ type: 'Paragraph', content }]
  }
  // Register the new list so other items can be added.
  lists[listId] = newList
  return newList
}

/**
 * Encode a Stencila `List` to GDoc `Paragraph` elements with a `bullet`.
 */
function encodeList(list: stencila.List): GDoc.Schema$StructuralElement[] {
  const lists = encodingGDoc.lists!
  // Generate a unique list id based on the index of the new list
  // Ids are always prefixed with `kix.` (an old code name for GDocs)
  // followed by a unique string. We use the index here for reversability.
  const listId = `kix.list${Object.keys(lists).length}`
  // Create a new list with this id
  lists[listId] = {
    listProperties: {
      nestingLevels: [
        {
          glyphType: list.order === 'ascending' ? '%0' : undefined
        }
      ]
    }
  }
  // Create the GDoc paragraphs with a bullet with the id
  const paras: GDoc.Schema$StructuralElement[] = list.items.map(item => {
    let para
    const type_ = type(item)
    if (type_ === 'Paragraph') {
      para = encodeParagraph(item as stencila.Paragraph)
    } else {
      throw new Error(`List item is unhandled Stencila node type "${type}"`)
    }
    para.paragraph!.bullet = { listId }
    return para
  })
  return paras
}

/**
 * Decode a GDoc `Table` element to a Stencila `Table`.
 */
function decodeTable(table: GDoc.Schema$Table): stencila.Table {
  return {
    type: 'Table',
    rows: (table.tableRows || []).map(
      (row: GDoc.Schema$TableRow): stencila.TableRow => {
        return {
          type: 'TableRow',
          cells: (row.tableCells || []).map(
            (cell: GDoc.Schema$TableCell): stencila.TableCell => {
              return {
                type: 'TableCell',
                content: (cell.content || []).map(
                  (
                    elem: GDoc.Schema$StructuralElement
                  ): stencila.InlineContent => {
                    if (elem.paragraph) {
                      if (elem.paragraph.elements) {
                        return decodeParagraphElement(
                          elem.paragraph.elements[0]
                        )
                      }
                    }
                    throw new Error(
                      'Sorry, currently can only handle paragraphs here'
                    )
                  }
                )
              }
            }
          )
        }
      }
    )
  }
}

/**
 * Encode a Stencila `Table` to GDoc `Table` element.
 */
function encodeTable(table: stencila.Table): GDoc.Schema$StructuralElement {
  return {
    table: {
      tableRows: table.rows.map(
        (row: stencila.TableRow): GDoc.Schema$TableRow => {
          return {
            tableCells: row.cells.map(
              (cell: stencila.TableCell): GDoc.Schema$TableCell => {
                return {
                  content: cell.content.map(
                    (
                      node: stencila.InlineContent
                    ): GDoc.Schema$StructuralElement => {
                      return {
                        paragraph: {
                          elements: [encodeInlineContent(node)]
                        }
                      }
                    }
                  )
                }
              }
            )
          }
        }
      )
    }
  }
}

/**
 * Decode a GDoc `SectionBreak` element to a Stencila `ThematicBreak`.
 */
function decodeSectionBreak(
  table: GDoc.Schema$SectionBreak
): stencila.ThematicBreak {
  return { type: 'ThematicBreak' }
}

/**
 * Encode a Stencila `ThematicBreak` to GDoc `SectionBreak` element.
 */
function encodeThematicBreak(
  table: stencila.ThematicBreak
): GDoc.Schema$StructuralElement {
  return {
    sectionBreak: {}
  }
}

/**
 * Decode a GDoc `ParagraphElement`.
 *
 * See the [docs](https://developers.google.com/docs/api/reference/rest/v1/documents#paragraphelement)
 * for a list of the possible union field types.
 */
function decodeParagraphElement(
  elem: GDoc.Schema$ParagraphElement
): stencila.InlineContent {
  // The paragraph element has one of these union fields
  if (elem.textRun) {
    return decodeTextRun(elem.textRun)
  }
  if (elem.inlineObjectElement) {
    return decodeInlineObjectElement(elem.inlineObjectElement)
  }
  if (elem.pageBreak || elem.horizontalRule) {
    // We can not decode these to a `ThematicBreak` (because that is not `InlineContent`)
    // So return them as string of text that resembles a Markdown encoded `ThematicBreak`
    return '* * *'
  }
  if (
    elem.autoText ||
    elem.columnBreak ||
    elem.footnoteReference ||
    elem.equation
  ) {
    // Ignore these fields for now.
    return ''
  }
  // We should never get here, but if we do, throw an error
  throw new Error(`Unhandled element type ${JSON.stringify(elem)}`)
}

function decodeInlineObjectElement(
  elem: GDoc.Schema$InlineObjectElement
): stencila.ImageObject {
  const inlineObjectId = elem.inlineObjectId
  if (!inlineObjectId) throw new Error('Malformed GDoc data')
  if (!decodingGDoc.inlineObjects) throw new Error('Malformed GDoc data')
  const inlineObjectProperties =
    decodingGDoc.inlineObjects[inlineObjectId].inlineObjectProperties
  if (!inlineObjectProperties) throw new Error('Malformed GDoc data')
  const embeddedObject = inlineObjectProperties.embeddedObject
  if (!embeddedObject) throw new Error('Malformed GDoc data')

  if (embeddedObject.imageProperties) {
    return decodeImage(embeddedObject, embeddedObject.imageProperties)
  } else {
    throw new Error(`Unhandled embedded object type ${embeddedObject}`)
  }
}

/**
 * Encode a Stencila inline content node to a GDoc `ParagraphElement`
 */
function encodeInlineContent(
  node: stencila.InlineContent
): GDoc.Schema$ParagraphElement {
  const type_ = type(node)
  switch (type_) {
    case 'Emphasis':
      return encodeEmphasis(node as stencila.Emphasis)
    case 'Strong':
      return encodeStrong(node as stencila.Strong)
    case 'Link':
      return encodeLink(node as stencila.Link)
    case 'ImageObject':
      return encodeImageObject(node as stencila.ImageObject)
    case 'string':
      return encodeString(node as string)
    default:
      throw new Error(`Unhandled node type ${type}`)
  }
}

/**
 * Decode a GDoc `TextRun` to a `string`, `Emphasis`, `Strong` or `Link` node.
 */
function decodeTextRun(
  textRun: GDoc.Schema$TextRun
): string | stencila.Emphasis | stencila.Strong | stencila.Link {
  let text = ''
  if (textRun.content) {
    let value = textRun.content
    if (value.endsWith('\n')) value = value.slice(0, -1)
    text = value
  }
  const textStyle = textRun.textStyle
  if (textStyle) {
    if (textStyle.italic) {
      return {
        type: 'Emphasis',
        content: [text]
      }
    }
    if (textStyle.bold) {
      return {
        type: 'Strong',
        content: [text]
      }
    }
    if (textStyle.link) {
      return {
        type: 'Link',
        content: [text],
        target: textStyle.link.url || ''
      }
    }
  }
  return text
}

/**
 * Stringify inline content nodes.
 *
 * This is necessary for elements like `TextRun` where the content must be
 * a simple string.
 */
function stringifyInlineContentNodes(nodes: stencila.InlineContent[]): string {
  return nodes
    .map(node => {
      switch (type(node)) {
        case 'Emphasis':
        case 'Strong':
          // @ts-ignore
          return node.content
        default:
          // @ts-ignore
          return node.toString()
      }
    })
    .join()
}

/**
 * Encode a `stencila.Emphasis` node to a GDoc `TextRun` node with `textStyle.italic`.
 */
function encodeEmphasis(em: stencila.Emphasis): GDoc.Schema$ParagraphElement {
  return {
    textRun: {
      content: stringifyInlineContentNodes(em.content),
      textStyle: {
        italic: true
      }
    }
  }
}

/**
 * Encode a `stencila.Strong` node to a GDoc `TextRun` node with `textStyle.bold`.
 */
function encodeStrong(strong: stencila.Strong): GDoc.Schema$ParagraphElement {
  return {
    textRun: {
      content: stringifyInlineContentNodes(strong.content),
      textStyle: {
        bold: true
      }
    }
  }
}

/**
 * Encode a `stencila.Link` node to a GDoc `TextRun` node with `textStyle.link`.
 */
function encodeLink(link: stencila.Link): GDoc.Schema$ParagraphElement {
  return {
    textRun: {
      content: stringifyInlineContentNodes(link.content),
      textStyle: {
        link: {
          url: link.target
        }
      }
    }
  }
}

/**
 * Decode a GDoc `EmbeddedObject` with `imageProperties` into a Stencila `ImageObject`.
 *
 * Because the `imageProperties.contentUri` is ephemeral (lasts about ~30mins) this
 * function fetches the URL before it disappears.
 */
function decodeImage(
  embeddedObject: GDoc.Schema$EmbeddedObject,
  imageProperties: GDoc.Schema$ImageProperties
): stencila.ImageObject {
  const { title, description } = embeddedObject
  const contentUrl = decodingFetcher(imageProperties.contentUri || '')
  return {
    type: 'ImageObject',
    contentUrl,
    title,
    text: description
  }
}

/**
 * Encode a Stencila `ImageObject` node to a GDoc `ParagraphElement` linked to
 * an image item in `inlineObjects`.
 */
function encodeImageObject(
  imageObject: stencila.ImageObject
): GDoc.Schema$ParagraphElement {
  const inlineObjects = encodingGDoc.inlineObjects!
  const inlineObjectId = `kix.inlineobj${Object.keys(inlineObjects).length}`
  inlineObjects[inlineObjectId] = {
    inlineObjectProperties: {
      embeddedObject: {
        imageProperties: {
          contentUri: imageObject.contentUrl
        },
        title: imageObject.title,
        description: imageObject.text
      }
    }
  }
  return {
    inlineObjectElement: {
      inlineObjectId
    }
  }
}

/**
 * Encode a `string` to a GDoc `TextRun`.
 */
function encodeString(value: string): GDoc.Schema$ParagraphElement {
  return {
    textRun: {
      content: value
    }
  }
}
