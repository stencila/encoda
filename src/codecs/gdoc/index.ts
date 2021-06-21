/**
 * [[include:src/codecs/gdoc/README.md]]
 *
 * @module codecs/gdoc
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
import { schema, http } from '@stencila/jesta'
import { docs_v1 as GDocT } from 'googleapis'
import tempy from 'tempy'
import { ensureBlockContentArrayOrUndefined } from '../../util/content/ensureBlockContentArray'

import * as vfile from '../../util/vfile'
import { DocxCodec } from '../docx'
import { Codec, CommonDecodeOptions, CommonEncodeOptions } from '../types'

const log = getLogger('encoda:gdoc')

interface DecodeOptions extends CommonDecodeOptions {
  fetch: boolean
}

/**
 * A codec for Google Docs.
 *
 * This codec currently does encoding of Google Docs via `docx`.
 * That is because (at the time of writing) the Google Docs API does not allow
 * creation of a Google Doc using the sample JSON as it does for getting a Google Doc.
 * A previous version of this file had encoding functions for various nodes types
 * but this was removed. See https://github.com/stencila/encoda/blob/4c87ea79450e50fbdc2aa6e12ededa597266d4e0/src/codecs/gdoc/index.ts#L35
 */
export class GDocCodec
  extends Codec<{}, DecodeOptions>
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
  ): Promise<schema.Node> => {
    const json = await vfile.dump(file)
    const gdoc = JSON.parse(json)
    return decodeDocument(gdoc, options.fetch)
  }

  /**
   * Encode a `stencila.Node` to a Microsoft Word document suitable for uploading
   * as a Google Doc.
   *
   * @param node The `stencila.Node` to encode
   * @returns A promise that resolves to a `VFile`
   */
  public readonly encode = (
    node: schema.Node,
    options: CommonEncodeOptions = this.commonEncodeDefaults
  ): Promise<vfile.VFile> => {
    return new DocxCodec().encode(node, options, {
      // Although the PNG tEXt chunks are not retained in the
      // Google Doc's images (Google modifies the images),
      // we enable this option for the RPNG themeing
      nodeInPng: true,
      nodeInAlt: true,
      nodeInLink: true,
    })
  }

  /**
   * @override Overrides {@link Codec.preWrite} so that media files
   * do NOT get written to a sibling folder (since they are embedded
   * in the DOCX file during encoding).
   */
  public preWrite(node: schema.Node): Promise<schema.Node> {
    return Promise.resolve(node)
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
    const filePath = tempy.file({ extension: ext })
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
): Promise<schema.Node> {
  decodingGDoc = { ...doc, listDepth: 0 }

  // Create a fetcher for remove resources
  const fetcher = new (fetch ? FetchToFile : FetchToSame)()
  decodingFetcher = fetcher.get.bind(fetcher)

  let title: string | schema.InlineContent[] | undefined =
    typeof doc.title === 'string' ? doc.title : undefined

  // Decode the content, if any
  let content: schema.Node[] = []
  const lists: { [key: string]: schema.List[] } = {}
  if (doc.body?.content) {
    content = (
      await Promise.all(
        doc.body.content.map(
          async (elem: GDocT.Schema$StructuralElement, index: number) => {
            if (elem.paragraph) {
              const para = elem.paragraph
              const block = await decodeParagraph(para, lists)

              // Ignore empty paragraphs
              if (schema.isA('Paragraph', block)) {
                const { content } = block
                if (
                  content.length === 0 ||
                  (content.length === 1 &&
                    typeof content[0] === 'string' &&
                    content[0].trim() === '')
                )
                  return undefined
              }

              // If this para has the `Title` style then use it's content
              // as the title of the article (overrides doc.title)
              if (schema.isA('Paragraph', block) && para.paragraphStyle) {
                const styleType = para.paragraphStyle.namedStyleType
                if (styleType && styleType === 'TITLE') {
                  const { content } = block
                  title =
                    content.length === 0
                      ? undefined
                      : content.length === 1 && typeof content[0] === 'string'
                      ? content[0]
                      : content
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
          }
        )
      )
    ).filter((node) => node !== undefined) as schema.Node[]
  }

  // Resolve the fetched resources
  await fetcher.resolve()

  return schema.article({
    title: title ?? undefined,
    content: ensureBlockContentArrayOrUndefined(content),
  })
}

/**
 * Decode a GDoc `Paragraph` to a Stencila node.
 *
 * Usually, the paragraph will be decoded to a `Paragraph`, `Heading` or `List`.
 * However, if the paragraph contains only one element and that element
 * is a reproducible image, then it will be decoded to the entity in that image
 * e.g. `CodeChunk`.
 */
async function decodeParagraph(
  para: GDocT.Schema$Paragraph,
  lists: { [key: string]: schema.List[] }
): Promise<schema.Node | undefined> {
  const { elements = [], paragraphStyle, bullet } = para

  const content = await Promise.all(elements.map(decodeParagraphElement))

  // See if the content is a single block content node, and if
  // so return that. Filtering is necessary to remove empty strings that
  // are sometimes created during decoding.
  const visibleContent = content.filter((node) => node !== '')
  if (visibleContent.length === 1 && schema.isBlockContent(visibleContent[0])) {
    return visibleContent[0]
  }

  // Ensure that now only have inline content, for the following node types
  const inlineContent = content.filter(schema.isInlineContent)

  if (paragraphStyle) {
    const styleType = paragraphStyle.namedStyleType
    if (styleType) {
      const match = /^HEADING_(\d)$/.exec(styleType)
      if (match) {
        return schema.heading({
          content: inlineContent,
          depth: parseInt(match[1], 10),
        })
      }
    }
  }

  if (bullet) return decodeListItem(para, inlineContent, lists)

  return schema.paragraph({ content: inlineContent })
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
  content: schema.InlineContent[],
  lists: { [key: string]: schema.List[] }
): schema.List | undefined {
  const bullet = assertDefined(para.bullet)
  // The list and the depth in that list that this
  // list item lives at
  const listId = assertDefined(bullet.listId)
  const listLevel = bullet.nestingLevel ?? 0

  // The item to add to a list
  const listItem = schema.listItem({
    content: [schema.paragraph({ content })],
  })

  // If we have jumped up a level then it means that
  // the list at the lower depth has been finished
  const { listDepth } = decodingGDoc
  if (listLevel < listDepth && lists[listId]) {
    delete lists[listId][listDepth]
  }
  decodingGDoc.listDepth = listLevel

  // If there is already a list with this id and level then add the item to it
  const existingList = lists[listId]?.[listLevel]
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
      ? 'Unordered'
      : 'Ascending'
  const newList: schema.List = schema.list({ items: [listItem], order })

  if (listLevel === 0) {
    // Register the new list so other items can be added.
    lists[listId] = [newList]
    return newList
  } else {
    // Add the new list to the parent list item
    const parent = lists[listId][listLevel - 1]
    const parentContent = assertDefined(
      parent.items[parent.items.length - 1].content
    ) as schema.BlockContent[]
    parentContent?.push(newList)
    // Register this list so that it too can act as a parent
    lists[listId][listLevel] = newList
    return undefined
  }
}

/**
 * Decode a GDoc `Table` element to a Stencila `Table`.
 */
async function decodeTable(table: GDocT.Schema$Table): Promise<schema.Table> {
  return {
    type: 'Table',
    rows: await Promise.all(
      (table.tableRows ?? []).map(
        async (row: GDocT.Schema$TableRow): Promise<schema.TableRow> => {
          return {
            type: 'TableRow',
            cells: await Promise.all(
              (row.tableCells ?? []).map(
                async (
                  cell: GDocT.Schema$TableCell
                ): Promise<schema.TableCell> => {
                  return {
                    type: 'TableCell',
                    content: await Promise.all(
                      (cell.content ?? []).map(
                        async (
                          elem: GDocT.Schema$StructuralElement
                        ): Promise<schema.InlineContent> => {
                          if (elem.paragraph) {
                            const { elements } = elem.paragraph
                            if (elements) {
                              return (
                                await Promise.all(
                                  elements.map(decodeParagraphElement)
                                )
                              ).filter(schema.isInlineContent)[0]
                            }
                          }
                          log.warn(
                            'Sorry, currently can only handle paragraphs in table cells'
                          )
                          return ''
                        }
                      )
                    ),
                  }
                }
              )
            ),
          }
        }
      )
    ),
  }
}

/**
 * Decode a GDoc `SectionBreak` element to a Stencila `ThematicBreak`.
 */
function decodeSectionBreak(): schema.ThematicBreak {
  return { type: 'ThematicBreak' }
}

/**
 * Decode a GDoc `ParagraphElement`.
 *
 * See the [docs](https://developers.google.com/docs/api/reference/rest/v1/documents#paragraphelement)
 * for a list of the possible union field types.
 */
async function decodeParagraphElement(
  elem: GDocT.Schema$ParagraphElement
): Promise<schema.Entity | schema.InlineContent> {
  // The paragraph element has one of these union fields
  if (elem.textRun) {
    return decodeTextRun(elem.textRun)
  }
  if (elem.inlineObjectElement) {
    return await decodeInlineObjectElement(elem.inlineObjectElement)
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
async function decodeInlineObjectElement(
  elem: GDocT.Schema$InlineObjectElement
): Promise<schema.Entity> {
  // Check if there is a link to a node
  const url = elem.textStyle?.link?.url
  if (
    typeof url === 'string' &&
    url.startsWith('https://hub.stenci.la/api/nodes/')
  ) {
    try {
      const headers =
        process.env.STENCILA_API_TOKEN !== undefined
          ? {
              Authorization: `Token ${process.env.STENCILA_API_TOKEN}`,
            }
          : {}
      const node = await http.client.get(url, { headers }).json()
      return (node as { node: schema.Entity }).node
    } catch {
      log.warn(`Error fetching node from ${url}`)
    }
  }

  const embeddedObject = assertDefined(
    assertDefined(
      assertDefined(decodingGDoc.inlineObjects)[
        assertDefined(elem.inlineObjectId)
      ].inlineObjectProperties
    ).embeddedObject
  )

  // Check if the description text is a JSON representation
  // of a node.
  const { description } = embeddedObject
  if (typeof description === 'string') {
    let node
    try {
      node = JSON.parse(description)
    } catch {
      // continue
    }
    if (node !== undefined && schema.isEntity(node)) {
      // If the description contains a Stencila entity then
      // return it
      return node
    }
  }

  if (embeddedObject.imageProperties) {
    return decodeImage(embeddedObject, embeddedObject.imageProperties)
  } else {
    log.warn(`Unhandled embedded object type ${JSON.stringify(embeddedObject)}`)
    return schema.imageObject({ contentUrl: '' })
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
  | schema.Emphasis
  | schema.Strong
  | schema.Delete
  | schema.Link
  | schema.Subscript
  | schema.Superscript {
  const { textStyle } = textRun
  const textContent = assertDefined(textRun.content)
  const text = textContent.endsWith('\n')
    ? textContent.slice(0, -1)
    : textContent
  const content = [text]

  if (textStyle) {
    if (textStyle.link)
      return schema.link({ content, target: textStyle.link.url ?? '' })
    if (textStyle.baselineOffset === 'SUPERSCRIPT')
      return schema.superscript({ content })
    if (textStyle.baselineOffset === 'SUBSCRIPT')
      return schema.subscript({ content })
    if (textStyle.strikethrough) return schema.del({ content })
    if (textStyle.bold) return schema.strong({ content })
    if (textStyle.italic) return schema.emphasis({ content })
  }

  return text
}

/**
 * Decode a GDoc `EmbeddedObject` with `imageProperties` into a Stencila `ImageObject`.
 *
 * Because the `imageProperties.contentUri` is ephemeral (lasts about ~30mins) this
 * function fetches the URL before it disappears.
 */
function decodeImage(
  embeddedObject: GDocT.Schema$EmbeddedObject,
  imageProperties: GDocT.Schema$ImageProperties
): schema.ImageObject {
  const { title, description } = embeddedObject
  const contentUri = imageProperties.contentUri ?? ''
  const contentUrl = contentUri.startsWith('http')
    ? decodingFetcher(contentUri)
    : contentUri
  return schema.imageObject({
    contentUrl,
    title: title !== null ? title : undefined,
    text: description !== null ? description : undefined,
  })
}
