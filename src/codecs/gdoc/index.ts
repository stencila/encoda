/**
 * @module gdoc
 */

/**
 * Hello contributor 👋! If you are working on this file, please
 * endeavor to remove the need for the following `eslint-disable` line 🙏.
 * Remove the line and run `npx eslint path/to/this/file.ts` to
 * see which code needs some linting ❤️.
 * See https://github.com/stencila/encoda/issues/199 for suggestions
 * on how to refactor code to avoid non-strict boolean expressions.
 */
/* eslint-disable @typescript-eslint/strict-boolean-expressions, @typescript-eslint/no-non-null-assertion */

import { getLogger } from '@stencila/logga'
import stencila, { isInlineContent } from '@stencila/schema'
import crypto from 'crypto'
import { docs_v1 as GDocT } from 'googleapis'
import { TxtCodec } from '../txt'
import * as http from '../../util/http'
import * as vfile from '../../util/vfile'
import { Codec, CommonDecodeOptions } from '../types'

const log = getLogger('encoda:gdoc')

interface DecodeOptions extends CommonDecodeOptions {
  fetch: boolean
}

export class GDocCodec extends Codec<{}, DecodeOptions>
  implements Codec<{}, DecodeOptions> {
  public readonly mediaTypes = ['application/vnd.google-apps.document']

  /**
   * Decode a `VFile` with `gdoc` contents to a `stencila.Node`.
   *
   * @param file The `VFile` to decode
   * @returns A promise that resolves to a `stencila.Node`
   */
  public readonly decode = async (
    file: vfile.VFile,
    options: DecodeOptions = { fetch: true }
  ): Promise<stencila.Node> => {
    const json = await vfile.dump(file)
    const gdoc = JSON.parse(json)
    return decodeDocument(gdoc, options.fetch)
  }

  /**
   * Encode a `stencila.Node` to a `VFile` with Markdown contents.
   *
   * @param node The `stencila.Node` to encode
   * @returns A promise that resolves to a `VFile`
   */
  public readonly encode = (node: stencila.Node): Promise<vfile.VFile> => {
    const gdoc = encodeNode(node)
    const json = JSON.stringify(gdoc, null, '  ')
    return Promise.resolve(vfile.load(json))
  }
}

/**
 * The GDoc currently being decoded from
 *
 * This is necessary as a context when decoding for retrieving properties
 * of list and images. We use a global object rather than having to pass
 * the reference to the document through all the function calls.
 */
let decodingGDoc: GDocT.Schema$Document & { listDepth: number }

/**
 * The GDoc currently being encoded to
 *
 * @see decodingGDoc
 */
let encodingGDoc: GDocT.Schema$Document

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
  private requests: Promise<void>[] = []

  public get(url: string, ext = ''): string {
    const filePath =
      crypto
        .createHash('md5')
        .update(url)
        .digest('hex') + ext
    this.requests.push(http.download(url, filePath))
    return filePath
  }

  public async resolve(): Promise<void[]> {
    return Promise.all(this.requests)
  }
}

/**
 * A dummy fetcher, used in testing.
 */
class FetchToSame {
  public get(url: string): string {
    return url
  }

  public resolve(): Promise<void> {
    return Promise.resolve()
  }
}

/**
 * Assert that a value is defined.
 *
 * In the GDoc Typescript definitions, all properties are optional i.e.
 * potentially `undefined`. In 44.0.0, all (?) properties were also allowed
 * to be `null` (https://github.com/googleapis/google-api-nodejs-client/pull/1824/files).
 * In practice though, working with actual documents,
 * many of them are reliably present. So this function provides a `null` and
 * `undefined` guard to prevent Typescript complaining while at the same
 * time providing a stack in the case that something is not defined.
 */
function assertDefined<T>(value: T | null | undefined): T | never {
  if (value === null) throw new Error('Value is unexpectedly null')
  if (value === undefined) throw new Error('Value is unexpectedly undefined')
  return value
}

/**
 * Decode a GDoc `Document` to a Stencila `Article`
 *
 * Note that currently `TableOfContents` child elements are ignored.
 */
async function decodeDocument(
  doc: GDocT.Schema$Document,
  fetch: boolean
): Promise<stencila.Node> {
  decodingGDoc = { ...doc, listDepth: 0 }

  // Create a fetcher for remove resources
  const fetcher = new (fetch ? FetchToFile : FetchToSame)()
  decodingFetcher = fetcher.get.bind(fetcher)

  let title: string | stencila.Paragraph[] | null | undefined = doc.title

  // Decode the content, if any
  let content: stencila.Node[] = []
  const lists: { [key: string]: stencila.List[] } = {}
  if (doc.body && doc.body.content) {
    content = doc.body.content
      .map((elem: GDocT.Schema$StructuralElement, index: number) => {
        if (elem.paragraph) {
          const para = elem.paragraph
          const block = decodeParagraph(para, lists)
          // If this para has the `Title` style then set it as the content
          if (stencila.isParagraph(block) && para.paragraphStyle) {
            const styleType = para.paragraphStyle.namedStyleType
            if (styleType && styleType === 'TITLE') {
              title = [block]
              return undefined
            }
          }
          return block
        } else if (elem.sectionBreak) {
          // The first element in the content is always a sectionBreak, so ignore it
          return index === 0 ? undefined : decodeSectionBreak()
        } else if (elem.table) {
          return decodeTable(elem.table)
        } else {
          log.warn(`Unhandled GDoc element type ${JSON.stringify(elem)}`)
        }
      })
      .filter(node => node !== undefined) as stencila.Node[]
  }

  // Resolve the fetched resources
  await fetcher.resolve()

  return stencila.article({
    title: title ?? undefined,
    content: content.length > 0 ? content : undefined
  })
}

/**
 * Encode a Stencila `Node` to a GDoc `Document`
 */
function encodeNode(node: stencila.Node): GDocT.Schema$Document {
  const gdoc: GDocT.Schema$Document = {
    title: 'Untitled',
    body: {
      content: [{ sectionBreak: {} }]
    },
    lists: {},
    inlineObjects: {}
  }
  encodingGDoc = gdoc

  const gdocContent = assertDefined(assertDefined(gdoc.body).content)

  // Wrap the node as needed to ensure an array
  // of block element at the top level
  let content: stencila.Node[] = []
  switch (stencila.nodeType(node)) {
    // `CreativeWork` types (have `content`)
    case 'Article': {
      const article = node as stencila.Article
      gdoc.title = TxtCodec.stringify(article.title ?? '')
      content = article.content ?? []
      break
    }
    // `BlockContent` types
    case 'Heading':
    case 'Paragraph':
    case 'CodeBlock':
    case 'List':
    case 'Table':
    case 'ThematicBreak': {
      content = [node]
      break
    }
    // Everything else is wrapped into a `Paragraph`
    default: {
      const para: stencila.Paragraph = {
        type: 'Paragraph',
        // TODO: avoid this use of `as`
        content: [node as stencila.InlineContent]
      }
      content = [para]
    }
  }

  if (content) {
    for (const node of content) {
      const type_ = stencila.nodeType(node)
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
          gdocContent.push(encodeThematicBreak())
          break
        default:
          log.warn(`Unhandled Stencila node type "${type_}"`)
      }
    }
  }
  return gdoc
}

/**
 * Decode a GDoc `Paragraph` to a Stencila node.
 *
 * Usually, the paragraph will be decoded to a `Paragraph`, `Heading` or `List`.
 * However, if the paragraph contains only one element and that element
 * is a reproducible image, then it will be decoded to the entity in that image
 * e.g. `CodeChunk`.
 */
function decodeParagraph(
  para: GDocT.Schema$Paragraph,
  lists: { [key: string]: stencila.List[] }
): stencila.Node | undefined {
  const { elements = [], paragraphStyle, bullet } = para

  const content = elements.map(decodeParagraphElement)

  // See if the content is a single block content node, and if
  // so return that. Filtering is necessary to remove empty strings that
  // are sometimes created during decoding.
  const visibleContent = content.filter(node => node !== '')
  if (
    visibleContent.length === 1 &&
    stencila.isBlockContent(visibleContent[0])
  ) {
    return visibleContent[0]
  }

  // Ensure that now only have inline content, for the following node types
  const inlineContent = content.filter(stencila.isInlineContent)

  if (paragraphStyle) {
    const styleType = paragraphStyle.namedStyleType
    if (styleType) {
      const match = /^HEADING_(\d)$/.exec(styleType)
      if (match) {
        return stencila.heading({
          content: inlineContent,
          depth: parseInt(match[1], 10)
        })
      }
    }
  }

  if (bullet) return decodeListItem(para, inlineContent, lists)

  return stencila.paragraph({ content: inlineContent })
}

/**
 * Encode a Stencila `Heading` to a GDoc `Paragraph` with a `HEADING_` style.
 */
function encodeHeading(
  heading: stencila.Heading
): GDocT.Schema$StructuralElement {
  const elem = encodeParagraph({
    type: 'Paragraph',
    content: heading.content
  })
  assertDefined(elem.paragraph).paragraphStyle = {
    namedStyleType: `HEADING_${heading.depth}`
  }
  return elem
}

/**
 * Encode a Stencila `Paragraph` to a GDoc `Paragraph`.
 */
function encodeParagraph(
  para: stencila.Paragraph
): GDocT.Schema$StructuralElement {
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
): GDocT.Schema$StructuralElement {
  return {
    paragraph: {
      elements: [
        {
          textRun: {
            content: block.text
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
 * @returns A new `List` or `undefined` if the paragraph was
 *        added to an existing list.
 */
function decodeListItem(
  para: GDocT.Schema$Paragraph,
  content: stencila.InlineContent[],
  lists: { [key: string]: stencila.List[] }
): stencila.List | undefined {
  const bullet = assertDefined(para.bullet)
  // The list and the depth in that list that this
  // list item lives at
  const listId = assertDefined(bullet.listId)
  const listLevel = bullet.nestingLevel ?? 0

  // The item to add to a list
  const listItem = stencila.listItem({
    content: [stencila.paragraph({ content })]
  })

  // If we have jumped up a level then it means that the
  // the list at the lower depth has been finished
  if (listLevel < decodingGDoc.listDepth) {
    delete lists[listId][decodingGDoc.listDepth]
  }
  decodingGDoc.listDepth = listLevel

  // If there is already a list with this id and level then add the item to it
  const existingList = lists[listId] && lists[listId][listLevel]
  if (existingList) {
    existingList.items.push(listItem)
    return undefined
  }

  // Create a new list with this paragraph as it's first item
  const nestingLevels = assertDefined(
    assertDefined(assertDefined(decodingGDoc.lists)[listId].listProperties)
      .nestingLevels
  )
  const nestingLevel = nestingLevels[listLevel]
  // It seems that the only way to tell if a list is ordered on unordered is to look at
  // the glyphType.
  // See https://developers.google.com/docs/api/reference/rest/v1/ListProperties#NestingLevel
  const order =
    typeof nestingLevel.glyphType === 'undefined' ||
    nestingLevel.glyphType === 'GLYPH_TYPE_UNSPECIFIED'
      ? 'unordered'
      : 'ascending'
  const newList = stencila.list({ items: [listItem], order })

  if (listLevel === 0) {
    // Register the new list so other items can be added.
    lists[listId] = [newList]
    return newList
  } else {
    // Add the new list to the parent list item
    const parent = lists[listId][listLevel - 1]
    assertDefined(parent)
    assertDefined(parent.items[parent.items.length - 1]).content.push(newList)
    // Register this list so that it too can act as a parent
    lists[listId][listLevel] = newList
    return undefined
  }
}

/**
 * Encode a Stencila `List` to a GDoc `List` and paragraphs that link to it.
 */
function encodeList(list: stencila.List): GDocT.Schema$StructuralElement[] {
  const lists = assertDefined(encodingGDoc.lists)
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
  return list.items.map(listItem => ({
    paragraph: encodeListItem(listItem, listId)
  }))
}

/**
 * Encode a Stencila `ListItem` to GDoc `Paragraph` elements with a `bullet`.
 */
const encodeListItem = (
  listItem: stencila.ListItem,
  listId: string
): GDocT.Schema$Paragraph => {
  const head = listItem.content[0]
  if (stencila.isParagraph(head)) {
    return {
      elements: head.content.map(encodeInlineContent),
      bullet: {
        listId
      }
    }
  }

  return {
    elements: listItem.content
      .filter(stencila.isInlineContent)
      .map(encodeInlineContent),
    bullet: {
      listId
    }
  }
}

/**
 * Decode a GDoc `Table` element to a Stencila `Table`.
 */
function decodeTable(table: GDocT.Schema$Table): stencila.Table {
  return {
    type: 'Table',
    rows: (table.tableRows ?? []).map(
      (row: GDocT.Schema$TableRow): stencila.TableRow => {
        return {
          type: 'TableRow',
          cells: (row.tableCells ?? []).map(
            (cell: GDocT.Schema$TableCell): stencila.TableCell => {
              return {
                type: 'TableCell',
                content: (cell.content ?? []).map(
                  (
                    elem: GDocT.Schema$StructuralElement
                  ): stencila.InlineContent => {
                    if (elem.paragraph) {
                      const { elements } = elem.paragraph
                      if (elements) {
                        return elements
                          .map(decodeParagraphElement)
                          .filter(stencila.isInlineContent)[0]
                      }
                    }
                    log.warn(
                      'Sorry, currently can only handle paragraphs in table cells'
                    )
                    return ''
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
function encodeTable(table: stencila.Table): GDocT.Schema$StructuralElement {
  return {
    table: {
      tableRows: table.rows.map(
        (row: stencila.TableRow): GDocT.Schema$TableRow => {
          return {
            tableCells: row.cells.map(
              (cell: stencila.TableCell): GDocT.Schema$TableCell => {
                return {
                  content: cell.content.filter(isInlineContent).map(
                    (
                      node: stencila.InlineContent
                    ): GDocT.Schema$StructuralElement => {
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
function decodeSectionBreak(): stencila.ThematicBreak {
  return { type: 'ThematicBreak' }
}

/**
 * Encode a Stencila `ThematicBreak` to GDoc `SectionBreak` element.
 */
function encodeThematicBreak(): GDocT.Schema$StructuralElement {
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
  elem: GDocT.Schema$ParagraphElement
): stencila.Entity | stencila.InlineContent {
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

  // We should never get here, but if we do, warn the user
  // and return an empty string.
  log.warn(`Unhandled element type ${JSON.stringify(elem)}`)
  return ''
}

/**
 * Decode a GDoc `InlineObjectElement` to a Stencila `Entity`.
 */
function decodeInlineObjectElement(
  elem: GDocT.Schema$InlineObjectElement
): stencila.Entity {
  const embeddedObject = assertDefined(
    assertDefined(
      assertDefined(decodingGDoc.inlineObjects)[
        assertDefined(elem.inlineObjectId)
      ].inlineObjectProperties
    ).embeddedObject
  )
  if (embeddedObject.imageProperties) {
    return decodeImage(embeddedObject, embeddedObject.imageProperties)
  } else {
    log.warn(`Unhandled embedded object type ${JSON.stringify(embeddedObject)}`)
    return stencila.imageObject({ contentUrl: '' })
  }
}

/**
 * Encode a Stencila inline content node to a GDoc `ParagraphElement`
 */
function encodeInlineContent(
  node: stencila.InlineContent
): GDocT.Schema$ParagraphElement {
  const type_ = stencila.nodeType(node)
  switch (type_) {
    case 'Emphasis':
      return encodeEmphasis(node as stencila.Emphasis)
    case 'Strong':
      return encodeStrong(node as stencila.Strong)
    case 'Delete':
      return encodeDelete(node as stencila.Delete)
    case 'Superscript':
      return encodeSuperscript(node as stencila.Superscript)
    case 'Subscript':
      return encodeSubscript(node as stencila.Subscript)
    case 'Link':
      return encodeLink(node as stencila.Link)
    case 'ImageObject':
      return encodeImageObject(node as stencila.ImageObject)
    case 'Text':
      return encodeString(node as string)
    default:
      log.warn(`Unhandled node type ${type_}`)
      return encodeString('')
  }
}

/**
 * Decode a GDoc `TextRun` to a `string`, `Emphasis`, `Strong`, `Delete`,
 * `Link`, `Subscript` or `Superscript` node.
 *
 * A `TextRun` can have multiple 'marking` e.g. a bold italic link. The decoding function
 * only decodes to the most "semantically important" e.g a `Link`.
 */
function decodeTextRun(
  textRun: GDocT.Schema$TextRun
):
  | string
  | stencila.Emphasis
  | stencila.Strong
  | stencila.Delete
  | stencila.Link
  | stencila.Subscript
  | stencila.Superscript {
  const { textStyle } = textRun
  const textContent = assertDefined(textRun.content)
  const text = textContent.endsWith('\n')
    ? textContent.slice(0, -1)
    : textContent
  const content = [text]

  if (textStyle) {
    if (textStyle.link)
      return stencila.link({ content, target: textStyle.link.url ?? '' })
    if (textStyle.baselineOffset === 'SUPERSCRIPT')
      return stencila.superscript({ content })
    if (textStyle.baselineOffset === 'SUBSCRIPT')
      return stencila.subscript({ content })
    if (textStyle.strikethrough) return stencila.del({ content })
    if (textStyle.bold) return stencila.strong({ content })
    if (textStyle.italic) return stencila.emphasis({ content })
  }

  return text
}

/**
 * Encode a Stencila `Emphasis` node to a GDoc `TextRun` node with `textStyle.italic`.
 */
function encodeEmphasis(em: stencila.Emphasis): GDocT.Schema$ParagraphElement {
  return {
    textRun: {
      content: TxtCodec.stringify(em),
      textStyle: {
        italic: true
      }
    }
  }
}

/**
 * Encode a Stencila `Strong` node to a GDoc `TextRun` node with `textStyle.bold`.
 */
function encodeStrong(strong: stencila.Strong): GDocT.Schema$ParagraphElement {
  return {
    textRun: {
      content: TxtCodec.stringify(strong),
      textStyle: {
        bold: true
      }
    }
  }
}

/**
 * Encode a Stencila `Delete` node to a GDoc `TextRun` node with `textStyle.strikethrough`.
 */
function encodeDelete(node: stencila.Delete): GDocT.Schema$ParagraphElement {
  return {
    textRun: {
      content: TxtCodec.stringify(node),
      textStyle: {
        strikethrough: true
      }
    }
  }
}

/**
 * Encode a Stencila `Superscript` node to a GDoc `TextRun` node with `textStyle.baselineOffset === 'SUPERSCRIPT'`.
 */
function encodeSuperscript(
  node: stencila.Superscript
): GDocT.Schema$ParagraphElement {
  return {
    textRun: {
      content: TxtCodec.stringify(node),
      textStyle: {
        baselineOffset: 'SUPERSCRIPT'
      }
    }
  }
}

/**
 * Encode a Stencila `Subscript` node to a GDoc `TextRun` node
 * with `textStyle.baselineOffset === 'SUBSCRIPT'`.
 */
function encodeSubscript(
  node: stencila.Subscript
): GDocT.Schema$ParagraphElement {
  return {
    textRun: {
      content: TxtCodec.stringify(node),
      textStyle: {
        baselineOffset: 'SUBSCRIPT'
      }
    }
  }
}

/**
 * Encode a Stencila `Link` node to a GDoc `TextRun` node with `textStyle.link`.
 */
function encodeLink(link: stencila.Link): GDocT.Schema$ParagraphElement {
  return {
    textRun: {
      content: TxtCodec.stringify(link),
      textStyle: {
        link: {
          url: link.target
        }
      }
    }
  }
}

/**
 * Decode a GDoc `EmbeddedObject` with `imageProperties` into a Stencila `Entity`.
 *
 * If the image has a description that can be parsed as JSON into a Stencila `Entity`,
 * then that entity will be returned. Otherwise, a `ImageObject` is returned.
 *
 * Because the `imageProperties.contentUri` is ephemeral (lasts about ~30mins) this
 * function fetches the URL before it disappears.
 */
function decodeImage(
  embeddedObject: GDocT.Schema$EmbeddedObject,
  imageProperties: GDocT.Schema$ImageProperties
): stencila.Entity {
  let { title, description } = embeddedObject
  if (title === null) title = undefined
  if (description === null) description = undefined

  // Check to see if this is a reproducible images i.e. that the
  // description contains JSON that can be parsed into a Stencila node.
  if (typeof description === 'string') {
    let node
    try {
      node = JSON.parse(description)
    } catch {
      // Do nothing
    }
    if (node !== undefined && stencila.isEntity(node)) {
      // If the description contains a Stencila entity then
      // return it
      return node
    }
  }

  const contentUrl = decodingFetcher(imageProperties.contentUri ?? '')
  return stencila.imageObject({
    contentUrl,
    title,
    text: description
  })
}

/**
 * Encode a Stencila `ImageObject` node to a GDoc `ParagraphElement` linked to
 * an image item in `inlineObjects`.
 */
function encodeImageObject(
  imageObject: stencila.ImageObject
): GDocT.Schema$ParagraphElement {
  const inlineObjects = encodingGDoc.inlineObjects!
  const inlineObjectId = `kix.inlineobj${Object.keys(inlineObjects).length}`
  inlineObjects[inlineObjectId] = {
    inlineObjectProperties: {
      embeddedObject: {
        imageProperties: {
          contentUri: imageObject.contentUrl
        },
        title: TxtCodec.stringify(imageObject.title ?? ''),
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
function encodeString(value: string): GDocT.Schema$ParagraphElement {
  return {
    textRun: {
      content: value
    }
  }
}
