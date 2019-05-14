/**
 * A compiler for Google Documents (GDoc).
 *
 * This compiler parses from, and unparses to, the GDoc JSON ('application/vnd.google-apps.document')
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

import * as stencila from '@stencila/schema'
import axios from 'axios'
import crypto from 'crypto'
import fs from 'fs'
import { docs_v1 as GDoc } from 'googleapis'
import { dump, load, VFile } from './vfile'

export const mediaTypes = ['application/vnd.google-apps.document']

/**
 * Parse a `VFile` with `gdoc` contents to a `stencila.Node`.
 *
 * @param file The `VFile` to parse
 * @returns A promise that resolves to a `stencila.Node`
 */
export async function parse(
  file: VFile,
  fetch: boolean = true
): Promise<stencila.Node> {
  const json = dump(file)
  const gdoc = JSON.parse(json)
  return parseDocument(gdoc, fetch)
}

/**
 * Unparse a `stencila.Node` to a `VFile` with Markdown contents.
 *
 * @param node The `stencila.Node` to unparse
 * @returns A promise that resolves to a `VFile`
 */
export async function unparse(node: stencila.Node): Promise<VFile> {
  const gdoc = unparseArticle(node as stencila.Article)
  const json = JSON.stringify(gdoc, null, '  ')
  return load(json)
}

/**
 * The GDoc currently being parsed from
 *
 * This is necessary as a context when parsing for retrieving properties
 * of list and images. We use a global object rather than having to pass
 * the reference to the document through all the function calls.
 */
let parsingGDoc: GDoc.Schema$Document

/**
 * The GDoc currently being unparsed to
 *
 * @see parsingGDoc
 */
let unparsingGDoc: GDoc.Schema$Document

/**
 * The function to use to fetch remote resources
 * during parsing. This allows us (a) to keep most of the parsing functions
 * synchronous and (b) turn off fetching during tests.
 */
let parsingFetcher: (url: string) => string

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
        console.error(`Error when fetching ${url}: ${error.message}`)
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
 * Parse a GDoc `Document` to a Stencila `Article`
 *
 * Note that currently `SectionBreak`, `Table` and `TableOfContents`
 * child elements are ignored.
 */
async function parseDocument(
  doc: GDoc.Schema$Document,
  fetch: boolean
): Promise<stencila.Node> {
  parsingGDoc = doc

  // Create a fetcher for remove resources
  const fetcher = new (fetch ? FetchToFile : FetchToSame)()
  parsingFetcher = fetcher.get.bind(fetcher)

  let content: Array<stencila.Node> = []
  let lists: { [key: string]: stencila.List } = {}
  if (doc.body && doc.body.content) {
    content = doc.body.content
      .map((elem: GDoc.Schema$StructuralElement, index: number) => {
        if (elem.paragraph) return parseParagraph(elem.paragraph, lists)
        else if (elem.sectionBreak) {
          // The first element in the content is always a sectionBreak, so ignore it
          return index === 0 ? undefined : parseSectionBreak(elem.sectionBreak)
        } else if (elem.table) return parseTable(elem.table)
        else {
          throw new Error(`Unhandled GDoc element type ${JSON.stringify(elem)}`)
        }
      })
      .filter(node => typeof node !== 'undefined') as Array<stencila.Node>
  }

  // Resolve the fetched resources
  await fetcher.resolve()

  return stencila.validate(
    {
      type: 'Article',
      title: doc.title,
      authors: [],
      content
    },
    'Article'
  )
}

/**
 * Unparse a Stencila `Article` to a GDoc `Document`
 */
function unparseArticle(article: stencila.Article): GDoc.Schema$Document {
  const gdoc: GDoc.Schema$Document = {
    title: article.title || 'Untitled',
    body: {
      content: [{ sectionBreak: {} }]
    },
    lists: {},
    inlineObjects: {}
  }
  unparsingGDoc = gdoc
  const content = gdoc.body!.content!

  if (article.content) {
    for (let node of article.content) {
      const type = stencila.type(node)
      switch (type) {
        case 'Heading':
          content.push(unparseHeading(node as stencila.Heading))
          break
        case 'Paragraph':
          content.push(unparseParagraph(node as stencila.Paragraph))
          break
        case 'CodeBlock':
          content.push(unparseCodeBlock(node as stencila.CodeBlock))
          break
        case 'List':
          content.push(...unparseList(node as stencila.List))
          break
        case 'Table':
          content.push(unparseTable(node as stencila.Table))
          break
        case 'ThematicBreak':
          content.push(unparseThematicBreak(node as stencila.ThematicBreak))
          break
        default:
          throw new Error(`Unhandled Stencila node type "${type}"`)
      }
    }
  }
  return gdoc
}

/**
 * Parse a GDoc `Paragraph` to a Stencila `Paragraph`, `Heading` or `List` node.
 */
function parseParagraph(
  para: GDoc.Schema$Paragraph,
  lists: { [key: string]: stencila.List }
): stencila.Paragraph | stencila.Heading | stencila.List | undefined {
  let content: any[] = []
  if (para.elements) {
    content = para.elements.map(node => parseParagraphElement(node))
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

  if (para.bullet) return parseList(para, content, lists)

  return {
    type: 'Paragraph',
    content
  }
}

/**
 * Unparse a Stencila `Heading` to a GDoc `Paragraph` with a `HEADING_` style.
 */
function unparseHeading(
  heading: stencila.Heading
): GDoc.Schema$StructuralElement {
  const elem = unparseParagraph({
    type: 'Paragraph',
    content: heading.content
  })
  elem.paragraph!.paragraphStyle = {
    namedStyleType: `HEADING_${heading.depth}`
  }
  return elem
}

/**
 * Unparse a Stencila `Paragraph` to a GDoc `Paragraph`.
 */
function unparseParagraph(
  para: stencila.Paragraph
): GDoc.Schema$StructuralElement {
  return {
    paragraph: {
      elements: para.content.map(unparseInlineContent)
    }
  }
}

/**
 * Unparse a Stencila `CodeBlock` to a GDOC `Paragraph`.
 */
function unparseCodeBlock(
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
 * Parse a GDoc list item paragraph (one with a `bullet`) to
 * a Stencila `List`.
 *
 * @returns A new `List` or undefined if the paragraph was
 *        added to an existing list.
 */
function parseList(
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
  if (!parsingGDoc.lists) throw new Error('WTF, the GDoc has no lists!')
  const list = parsingGDoc.lists[listId].listProperties
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
 * Unparse a Stencila `List` to GDoc `Paragraph` elements with a `bullet`.
 */
function unparseList(list: stencila.List): GDoc.Schema$StructuralElement[] {
  const lists = unparsingGDoc.lists!
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
    const type = stencila.type(item)
    if (type === 'Paragraph') {
      para = unparseParagraph(item as stencila.Paragraph)
    } else {
      throw new Error(`List item is unhandled Stencila node type "${type}"`)
    }
    para.paragraph!.bullet = { listId }
    return para
  })
  return paras
}

/**
 * Parse a GDoc `Table` element to a Stencila `Table`.
 */
function parseTable(table: GDoc.Schema$Table): stencila.Table {
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
                        return parseParagraphElement(elem.paragraph.elements[0])
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
 * Unparse a Stencila `Table` to GDoc `Table` element.
 */
function unparseTable(table: stencila.Table): GDoc.Schema$StructuralElement {
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
                          elements: [unparseInlineContent(node)]
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
 * Parse a GDoc `SectionBreak` element to a Stencila `ThematicBreak`.
 */
function parseSectionBreak(
  table: GDoc.Schema$SectionBreak
): stencila.ThematicBreak {
  return { type: 'ThematicBreak' }
}

/**
 * Unparse a Stencila `ThematicBreak` to GDoc `SectionBreak` element.
 */
function unparseThematicBreak(
  table: stencila.ThematicBreak
): GDoc.Schema$StructuralElement {
  return {
    sectionBreak: {}
  }
}

/**
 * Parse a GDoc `ParagraphElement` (something withing a paragraph :)
 */
function parseParagraphElement(
  elem: GDoc.Schema$ParagraphElement
): stencila.InlineContent {
  if (elem.textRun) return parseTextRun(elem.textRun)
  if (elem.inlineObjectElement) {
    return parseInlineObjectElement(elem.inlineObjectElement)
  } else throw new Error(`Unhandled element type ${JSON.stringify(elem)}`)
}

function parseInlineObjectElement(
  elem: GDoc.Schema$InlineObjectElement
): stencila.ImageObject {
  const inlineObjectId = elem.inlineObjectId
  if (!inlineObjectId) throw new Error('Malformed GDoc data')
  if (!parsingGDoc.inlineObjects) throw new Error('Malformed GDoc data')
  const inlineObjectProperties =
    parsingGDoc.inlineObjects[inlineObjectId].inlineObjectProperties
  if (!inlineObjectProperties) throw new Error('Malformed GDoc data')
  const embeddedObject = inlineObjectProperties.embeddedObject
  if (!embeddedObject) throw new Error('Malformed GDoc data')

  if (embeddedObject.imageProperties) {
    const { title, description } = embeddedObject
    const { contentUri } = embeddedObject.imageProperties
    return {
      type: 'ImageObject',
      // The `contentUri` is emphemeral so fetch it before it disappears ~30mins
      contentUrl: parsingFetcher(contentUri || ''),
      caption: title,
      description: description
    }
  } else {
    throw new Error(`Unhandled embedded object type ${embeddedObject}`)
  }
}

/**
 * Unparse a Stencila inline content node to a GDoc `ParagraphElement`
 */
function unparseInlineContent(
  node: stencila.InlineContent
): GDoc.Schema$ParagraphElement {
  const type = stencila.type(node)
  switch (type) {
    case 'Emphasis':
      return unparseEmphasis(node as stencila.Emphasis)
    case 'Strong':
      return unparseStrong(node as stencila.Strong)
    case 'Link':
      return unparseLink(node as stencila.Link)
    case 'ImageObject':
      return unparseImageObject(node as stencila.ImageObject)
    case 'string':
      return unparseString(node as string)
    default:
      throw new Error(`Unhandled node type ${type}`)
  }
}

/**
 * Parse a GDoc `TextRun` to a `string`, `Emphasis`, `Strong` or `Link` node.
 */
function parseTextRun(
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
      const type = stencila.type(node)
      switch (type) {
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
 * Unparse a `stencila.Emphasis` node to a GDoc `TextRun` node with `textStyle.italic`.
 */
function unparseEmphasis(em: stencila.Emphasis): GDoc.Schema$ParagraphElement {
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
 * Unparse a `stencila.Strong` node to a GDoc `TextRun` node with `textStyle.bold`.
 */
function unparseStrong(strong: stencila.Strong): GDoc.Schema$ParagraphElement {
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
 * Unparse a `stencila.Link` node to a GDoc `TextRun` node with `textStyle.link`.
 */
function unparseLink(link: stencila.Link): GDoc.Schema$ParagraphElement {
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
 * Unparse a `stencila.ImageObject` node to a GDoc `TextRun` node with `textStyle.link`.
 */
function unparseImageObject(
  image: stencila.ImageObject
): GDoc.Schema$ParagraphElement {
  const inlineObjects = unparsingGDoc.inlineObjects!
  const inlineObjectId = `kix.inlineobj${Object.keys(inlineObjects).length}`
  inlineObjects[inlineObjectId] = {
    inlineObjectProperties: {
      embeddedObject: {
        imageProperties: {
          contentUri: image.contentUrl
        },
        title: image.caption,
        description: image.description
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
 * Unparse a `string` to a GDoc `TextRun`.
 */
function unparseString(value: string): GDoc.Schema$ParagraphElement {
  return {
    textRun: {
      content: value
    }
  }
}
