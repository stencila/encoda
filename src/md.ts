/**
 * # Markdown codec
 *
 * These functions transform nodes from a [Markdown Abstract Syntax Tree](https://github.com/syntax-tree/mdast) to
 * nodes in a [Stencila Document Tree](https://github.com/stencila/schema).
 *
 * @module md
 */

/** A comment required for above to be included in docs.
 * See https://github.com/christopherthielen/typedoc-plugin-external-module-name/issues/300
 */

import * as stencila from '@stencila/schema'
import * as yaml from 'js-yaml'
import JSON5 from 'json5'
import * as MDAST from 'mdast'
// @ts-ignore
import compact from 'mdast-util-compact'
// @ts-ignore
import attrs from 'remark-attr'
// @ts-ignore
import frontmatter from 'remark-frontmatter'
// @ts-ignore
import genericExtensions from 'remark-generic-extensions'
// @ts-ignore
import parser from 'remark-parse'
// @ts-ignore
import stringifier from 'remark-stringify'
import unified from 'unified'
import * as UNIST from 'unist'
// @ts-ignore
import filter from 'unist-util-filter'
// @ts-ignore
import map from 'unist-util-map'
import { coerce } from './util'
import { load, VFile } from './vfile'

export const mediaTypes = ['text/markdown', 'text/x-markdown']

/**
 * Options for `remark-frontmatter` plugin
 *
 * @see https://github.com/remarkjs/remark-frontmatter#matter
 */
const FRONTMATTER_OPTIONS = [{ type: 'yaml', marker: '-' }]

/**
 * Options for `remark-attr` plugin
 */
const ATTR_OPTIONS = { scope: 'permissive' }

/**
 * Registered generic extensions.
 *
 * @see Extension
 */
const GENERIC_EXTENSIONS = [
  'quote',

  'null',
  'true',
  'false',
  'boolean',
  'number',
  'array',
  'object'
]

/**
 * Decode a `VFile` with Markdown contents to a `stencila.Node`.
 *
 * @param file The `VFile` to decode
 * @returns A promise that resolves to a `stencila.Node`
 */
export async function decode(file: VFile): Promise<stencila.Node> {
  const extensionHandlers: { [key: string]: any } = {}
  for (let ext of GENERIC_EXTENSIONS) {
    extensionHandlers[ext] = { replace: decodeExtension }
  }
  const mdast = unified()
    .use(parser, {
      commonmark: true
    })
    .use(frontmatter, FRONTMATTER_OPTIONS)
    .use(attrs, ATTR_OPTIONS)
    .use(genericExtensions, { elements: extensionHandlers })
    .parse(file)
  compact(mdast, true)
  return decodeNode(mdast)
}

/**
 * Encode a `stencila.Node` to a `VFile` with Markdown contents.
 *
 * @param thing The `stencila.Node` to encode
 * @returns A promise that resolves to a `VFile`
 */
export async function encode(node: stencila.Node): Promise<VFile> {
  let mdast = filter(
    encodeNode(node),
    (node: UNIST.Node | undefined) => typeof node !== 'undefined'
  ) as UNIST.Node

  mdast = stringifyExtensions(mdast)
  mdast = stringifyAttrs(mdast)

  const md = unified()
    .use(stringifier)
    .use(frontmatter, FRONTMATTER_OPTIONS)
    .stringify(mdast)
  return load(md)
}

function decodeNode(node: UNIST.Node): stencila.Node {
  const type = node.type
  switch (type) {
    case 'root':
      return decodeRoot(node as MDAST.Root)

    case 'heading':
      return decodeHeading(node as MDAST.Heading)
    case 'paragraph':
      return decodeParagraph(node as MDAST.Paragraph)
    case 'blockquote':
      return decodeBlockquote(node as MDAST.Blockquote)
    case 'code':
      return decodeCodeblock(node as MDAST.Code)
    case 'list':
      return decodeList(node as MDAST.List)
    case 'table':
      return decodeTable(node as MDAST.Table)
    case 'thematicBreak':
      return decodeThematicBreak(node as MDAST.ThematicBreak)

    case 'link':
      return decodeLink(node as MDAST.Link)
    case 'emphasis':
      return decodeEmphasis(node as MDAST.Emphasis)
    case 'strong':
      return decodeStrong(node as MDAST.Strong)
    case 'delete':
      return decodeDelete(node as MDAST.Delete)
    case 'inlineCode':
      return decodeInlineCode(node as MDAST.InlineCode)
    case 'image':
      return decodeImage(node as MDAST.Image)
    case 'text':
      return decodeText(node as MDAST.Text)
    case 'inline-extension':
      const ext = (node as unknown) as Extension
      switch (ext.name) {
        case 'quote':
          return decodeQuote(ext)

        case 'null':
          return decodeNull(ext)
        case 'boolean':
        case 'true':
        case 'false':
          return decodeBoolean(ext)
        case 'number':
          return decodeNumber(ext)
        case 'array':
          return decodeArray(ext)
        case 'object':
          return decodeObject(ext)

        default:
          if (ext.name) {
            throw new Error(`Unhandled generic extension "${ext.name}"`)
          } else {
            throw new Error(
              `Unregistered generic extension "${node.data && node.data.hName}"`
            )
          }
      }

    default:
      throw new Error(`No Markdown decoder for MDAST node type "${type}"`)
  }
}

function encodeNode(node: stencila.Node): UNIST.Node | undefined {
  const type = stencila.type(node)
  switch (type) {
    case 'Article':
      return encodeArticle(node as stencila.Article)

    case 'Heading':
      return encodeHeading(node as stencila.Heading)
    case 'Paragraph':
      return encodeParagraph(node as stencila.Paragraph)
    case 'QuoteBlock':
      return encodeQuoteBlock(node as stencila.QuoteBlock)
    case 'CodeBlock':
      return encodeCodeBlock(node as stencila.CodeBlock)
    case 'List':
      return encodeList(node as stencila.List)
    case 'Table':
      return encodeTable(node as stencila.Table)
    case 'ThematicBreak':
      return encodeThematicBreak(node as stencila.ThematicBreak)

    case 'Link':
      return encodeLink(node as stencila.Link)
    case 'Emphasis':
      return encodeEmphasis(node as stencila.Emphasis)
    case 'Strong':
      return encodeStrong(node as stencila.Strong)
    case 'Delete':
      return encodeDelete(node as stencila.Delete)
    case 'Quote':
      return encodeQuote(node as stencila.Quote)
    case 'Code':
      return encodeCode(node as stencila.Code)
    case 'ImageObject':
      return encodeImageObject(node as stencila.ImageObject)

    case 'string':
      return encodeString(node as string)
    case 'null':
      return encodeNull(node as null)
    case 'boolean':
      return encodeBoolean(node as boolean)
    case 'number':
      return encodeNumber(node as number)
    case 'array':
      return encodeArray(node as Array<any>)
    case 'object':
      return encodeObject(node as object)

    default:
      throw new Error(`No Markdown encoder for Stencila node type "${type}"`)
  }
}

function encodeContent(node: stencila.Node): MDAST.Content {
  return encodeNode(node) as MDAST.Content
}

function decodePhrasingContent(
  node: MDAST.PhrasingContent
): stencila.InlineContent {
  return decodeNode(node) as stencila.InlineContent
}

function encodeInlineContent(
  node: stencila.InlineContent
): MDAST.PhrasingContent {
  return encodeNode(node) as MDAST.PhrasingContent
}

function decodeBlockContent(node: MDAST.BlockContent): stencila.BlockContent {
  return decodeNode(node) as stencila.BlockContent
}

function encodeBlockContent(node: stencila.BlockContent): MDAST.BlockContent {
  return encodeNode(node) as MDAST.BlockContent
}

/**
 * Decode a `MDAST.root` node to a `stencila.Article`
 *
 * If the root has a front matter node (defined using YAML), that
 * meta data is added to the top level of the document. Other
 * child nodes are added to the article's `content` property.
 *
 * @param root The MDAST root to decode
 */
function decodeRoot(root: MDAST.Root): stencila.Article {
  const article = stencila.create(
    'Article',
    {
      // TODO: the `create function should automatically add empty
      // array for array properties that are required
      authors: []
    },
    'mutate'
  )

  const body: Array<stencila.Node> = []
  for (let child of root.children) {
    if (child.type === 'yaml') {
      const frontmatter = yaml.safeLoad(child.value)
      // TODO: check the key is a valid property of Article
      // and if it it isn't ignore it or throw an error
      // TODO: allow for mutation and aliases, potentially
      // adding a `stencila.set(article, key, value)` function.
      for (let [key, value] of Object.entries(frontmatter)) {
        // TODO: the above should allow removal of the ts-ignore
        // @ts-ignore
        article[key] = value
      }
    } else {
      body.push(decodeNode(child))
    }
  }
  article.content = body

  // TODO: remove the following which mutates any YAML
  // meta data to conform to the schema when above TODO is added
  return coerce(article, 'Article')
}

/**
 * Encode a `stencila.Article` to a `MDAST.Root`
 *
 * The article's `content` property becomes the root's `children`
 * and any other properties are serialized as YAML
 * front matter and prepended to the children.
 *
 * @param node The Stencila article to encode
 */
function encodeArticle(article: stencila.Article): MDAST.Root {
  const root: MDAST.Root = {
    type: 'root',
    children: []
  }

  // Encode the article body
  if (article.content) {
    root.children = article.content.map(encodeContent)
  }

  // Add other properties as frontmatter
  const frontmatter: { [key: string]: any } = {}
  for (let [key, value] of Object.entries(article)) {
    if (!['type', 'content'].includes(key)) {
      frontmatter[key] = value
    }
  }
  if (Object.keys(frontmatter).length) {
    const yamlNode: MDAST.YAML = {
      type: 'yaml',
      value: yaml.safeDump(frontmatter).trim()
    }
    root.children.unshift(yamlNode)
  }

  return root
}

/**
 * Decode a `MDAST.Heading` to a `stencila.Heading`
 */
function decodeHeading(heading: MDAST.Heading): stencila.Heading {
  return {
    type: 'Heading',
    depth: heading.depth,
    content: heading.children.map(decodePhrasingContent)
  }
}

/**
 * Encode a `stencila.Heading` to a `MDAST.Heading`
 */
function encodeHeading(heading: stencila.Heading): MDAST.Heading {
  return {
    type: 'heading',
    depth: heading.depth as (1 | 2 | 3 | 4 | 5 | 6),
    children: heading.content.map(encodeInlineContent)
  }
}

/**
 * Decode a `MDAST.Paragraph` to a `stencila.Paragraph`
 */
function decodeParagraph(paragraph: MDAST.Paragraph): stencila.Paragraph {
  return {
    type: 'Paragraph',
    content: paragraph.children.map(decodePhrasingContent)
  }
}

/**
 * Encode a `stencila.Paragraph` to a `MDAST.Paragraph`
 *
 * Returns `undefined` (i.e skip this node) if the paragraph
 * is empty (not content, or only whitespace)
 */
function encodeParagraph(
  paragraph: stencila.Paragraph
): MDAST.Paragraph | undefined {
  const content = paragraph.content
  if (
    content.length === 0 ||
    (content.length === 1 &&
      stencila.type(content[0]) === 'string' &&
      (content[0] as string).trim().length === 0)
  ) {
    return undefined
  } else {
    return {
      type: 'paragraph',
      children: content.map(encodeInlineContent)
    }
  }
}

/**
 * Decode a `MDAST.Blockquote` to a `stencila.QuoteBlock`
 */
function decodeBlockquote(block: MDAST.Blockquote): stencila.QuoteBlock {
  return {
    type: 'QuoteBlock',
    content: block.children.map(decodeBlockContent)
  }
}

/**
 * Encode a `stencila.QuoteBlock` to a `MDAST.Blockquote`
 */
function encodeQuoteBlock(block: stencila.QuoteBlock): MDAST.Blockquote {
  return {
    type: 'blockquote',
    children: block.content.map(encodeBlockContent)
  }
}

/**
 * Decode a `MDAST.Code` to a `stencila.CodeBlock`
 *
 * The ["info string"](https://spec.commonmark.org/0.29/#info-string)
 * is decoded to the `meta` dictionary on the `CodeBlock`. For example,
 * the code block starting with,
 *
 * ~~~markdown
 * ```python python meta1 meta2=foo meta3="bar baz"
 * ~~~
 *
 * is decoded to a `CodeBlock` with `language` `"python"` and `meta`
 * `{meta1:"", meta2:"foo", meta3:"bar baz" }`
 */
function decodeCodeblock(block: MDAST.Code): stencila.CodeBlock {
  // The `remark-attrs` plugin decodes the "info string" to `data.hProperties`
  const meta = block.data && block.data.hProperties
  return {
    type: 'CodeBlock',
    language: block.lang,
    meta,
    value: block.value
  }
}

/**
 * Encode a `stencila.CodeBlock` to a `MDAST.Code`
 */
function encodeCodeBlock(block: stencila.CodeBlock): MDAST.Code {
  const meta = block.meta ? stringifyMeta(block.meta) : ''
  return {
    type: 'code',
    lang: block.language,
    meta,
    value: block.value
  }
}

/**
 * Decode a `MDAST.List` to a `stencila.List`
 */
function decodeList(list: MDAST.List): stencila.List {
  const items = []
  for (let item of list.children) {
    // TODO: when there are more than one child then create a stencila.Block
    let node = decodeNode(item.children[0])

    // If the item has a check box then insert that as a boolean as the first
    // child of the first child
    if (item.checked === true || item.checked === false) {
      // @ts-ignore
      if (node.content) node.content = [item.checked, ...node.content]
    }

    items.push(node)
  }
  return {
    type: 'List',
    order: list.ordered ? 'ascending' : 'unordered',
    items
  }
}

/**
 * Encode a `stencila.List` to a `MDAST.List`
 */
function encodeList(list: stencila.List): MDAST.List {
  return {
    type: 'list',
    ordered: list.order === 'ascending',
    children: list.items.map(
      (item: stencila.Node): MDAST.ListItem => {
        // TODO: wrap anything that is not inline content into a block e.g. para
        const first = encodeNode(item) as MDAST.BlockContent
        const children = [first]

        // Is this a checked item (ie. a paragraph starting with a boolean)?
        let checked: boolean | undefined = undefined
        if (first.type === 'paragraph') {
          // @ts-ignore
          if (first.children[0].type === 'inline-extension') {
            if (['true', 'false'].includes(first.children[0].name as string)) {
              // Apply the boolean name to this list item
              checked = first.children[0].name === 'true'
              // Remove the boolean checkbox from the paragraph (since remark stringify does that)
              first.children = first.children.slice(1)
            }
          }
        }

        return {
          type: 'listItem',
          checked,
          children
        }
      }
    )
  }
}

/**
 * Decode a `MDAST.Table` to a `stencila.Table`
 */
function decodeTable(table: MDAST.Table): stencila.Table {
  return {
    type: 'Table',
    rows: table.children.map(
      (row: MDAST.TableRow): stencila.TableRow => {
        return {
          type: 'TableRow',
          cells: row.children.map(
            (cell: MDAST.TableCell): stencila.TableCell => {
              return {
                type: 'TableCell',
                content: cell.children.map(decodePhrasingContent)
              }
            }
          )
        }
      }
    )
  }
}

/**
 * Encode a `stencila.Table` to a `MDAST.Table`
 */
function encodeTable(table: stencila.Table): MDAST.Table {
  return {
    type: 'table',
    children: table.rows.map(
      (row: stencila.TableRow): MDAST.TableRow => {
        return {
          type: 'tableRow',
          children: row.cells.map(
            (cell: stencila.TableCell): MDAST.TableCell => {
              return {
                type: 'tableCell',
                children: cell.content.map(encodeInlineContent)
              }
            }
          )
        }
      }
    )
  }
}

/**
 * Decode a `MDAST.ThematicBreak` to a `stencila.ThematicBreak`
 */
function decodeThematicBreak(
  tbreak: MDAST.ThematicBreak
): stencila.ThematicBreak {
  return {
    type: 'ThematicBreak'
  }
}

/**
 * Encode a `stencila.ThematicBreak` to a `MDAST.ThematicBreak`
 */
function encodeThematicBreak(
  tbreak: stencila.ThematicBreak
): MDAST.ThematicBreak {
  return {
    type: 'thematicBreak'
  }
}

/**
 * Decode a `MDAST.Link` to a `stencila.Link`
 */
function decodeLink(link: MDAST.Link): stencila.Link {
  // The `remark-attrs` plugin decodes curly brace attributes to `data.hProperties`
  const meta = (link.data && link.data.hProperties) as {
    [key: string]: string
  }
  return {
    type: 'Link',
    target: link.url,
    content: link.children.map(decodePhrasingContent),
    // TODO: remove ts-ignore, when add meta as property to link
    // @ts-ignore
    meta
  }
}

/**
 * Encode a `stencila.Link` to a `MDAST.Link`
 */
function encodeLink(link: stencila.Link): MDAST.Link {
  // TODO: remove ts-ignore, when add meta as property to link
  // @ts-ignore
  const data = { hProperties: link.meta }
  return {
    type: 'link',
    url: link.target,
    children: link.content.map(
      node => encodeInlineContent(node) as MDAST.StaticPhrasingContent
    ),
    data
  }
}

/**
 * Decode a `MDAST.Emphasis` to a `stencila.Emphasis`
 */
function decodeEmphasis(emphasis: MDAST.Emphasis): stencila.Emphasis {
  return {
    type: 'Emphasis',
    content: emphasis.children.map(decodePhrasingContent)
  }
}

/**
 * Encode a `stencila.Emphasis` to a `MDAST.Emphasis`
 */
function encodeEmphasis(emphasis: stencila.Emphasis): MDAST.Emphasis {
  return {
    type: 'emphasis',
    children: emphasis.content.map(encodeInlineContent)
  }
}

/**
 * Decode a `MDAST.Strong` to a `stencila.Strong`
 */
function decodeStrong(strong: MDAST.Strong): stencila.Strong {
  return {
    type: 'Strong',
    content: strong.children.map(decodePhrasingContent)
  }
}

/**
 * Encode a `stencila.Strong` to a `MDAST.Strong`
 */
function encodeStrong(strong: stencila.Strong): MDAST.Strong {
  return {
    type: 'strong',
    children: strong.content.map(encodeInlineContent)
  }
}

/**
 * Decode a `MDAST.Delete` to a `stencila.Delete`
 */
function decodeDelete(delet: MDAST.Delete): stencila.Delete {
  return {
    type: 'Delete',
    content: delet.children.map(decodePhrasingContent)
  }
}

/**
 * Encode a `stencila.Delete` to a `MDAST.Delete`
 */
function encodeDelete(delet: stencila.Delete): MDAST.Delete {
  return {
    type: 'delete',
    children: delet.content.map(encodeInlineContent)
  }
}

/**
 * Decode a `!quote` inline extension to a `Quote`.
 *
 * Valid quotes include:
 *
 *   - `!quote[Quoted content]`
 *   - `!quote[Quoted content with _emphasis_](https://example.org)`
 */
function decodeQuote(ext: Extension): stencila.Quote {
  const quote: stencila.Quote = {
    type: 'Quote',
    // TODO: possibly decode the ext.content as Markdown?
    content: ext.content ? [ext.content] : []
  }
  const cite = ext.argument
  if (cite) quote.citation = cite
  return quote
}

/**
 * Encode a `stencila.Quote` to a `!quote` inline extension
 */
function encodeQuote(quote: stencila.Quote): Extension {
  return {
    type: 'inline-extension',
    name: 'quote',
    // TODO: Handle cases where content is more than one string
    content: quote.content[0] as string,
    argument: quote.citation
  }
}

/**
 * Decode a `MDAST.InlineCode` to a `stencila.Code`
 */
function decodeInlineCode(inlineCode: MDAST.InlineCode): stencila.Code {
  const code: stencila.Code = {
    type: 'Code',
    value: inlineCode.value
  }
  const attrs =
    inlineCode.data &&
    (inlineCode.data.hProperties as { [key: string]: string })
  if (attrs) {
    const { language, ...rest } = attrs
    if (language) code.language = language
    // TODO: remove ts-ignore
    // @ts-ignore
    if (Object.keys(rest).length) code.meta = rest
  }
  return code
}

/**
 * Encode a `stencila.Code` to a `MDAST.InlineCode`
 */
function encodeCode(code: stencila.Code): MDAST.InlineCode {
  let attrs
  if (code.language) attrs = { language: code.language }
  // TODO: remove ts-ignore
  // @ts-ignore
  if (code.meta) attrs = { ...attrs, ...code.meta }
  return {
    type: 'inlineCode',
    data: { hProperties: attrs },
    value: code.value
  }
}

/**
 * Decode a `MDAST.Image` to a `stencila.ImageObject`
 */
function decodeImage(image: MDAST.Image): stencila.ImageObject {
  const imageObject: stencila.ImageObject = {
    type: 'ImageObject',
    contentUrl: image.url
  }
  if (image.title) imageObject.title = image.title
  if (image.alt) imageObject.text = image.alt
  // The `remark-attrs` plugin decodes curly brace attributes to `data.hProperties`
  const meta = image.data && image.data.hProperties
  // TODO: remove ts-ignore
  // @ts-ignore
  if (meta) imageObject.meta = meta
  return imageObject
}

/**
 * Encode a `stencila.ImageObject` to a `MDAST.Image`
 */
function encodeImageObject(imageObject: stencila.ImageObject): MDAST.Image {
  const image: MDAST.Image = {
    type: 'image',
    url: imageObject.contentUrl || ''
  }
  if (imageObject.title) image.title = imageObject.title
  if (imageObject.text) image.alt = imageObject.text
  // TODO: remove ts-ignore
  // @ts-ignore
  if (imageObject.meta) image.data = { hProperties: imageObject.meta }
  return image
}

/**
 * Decode a `MDAST.Text` to a `string`
 */
function decodeText(text: MDAST.Text): string {
  return text.value
}

/**
 * Encode a `string` to a `MDAST.Text`
 */
function encodeString(value: string): MDAST.Text {
  return { type: 'text', value }
}

/**
 * Decode a `!null` inline extension to `null`
 */
function decodeNull(ext: Extension): null {
  return null
}

/**
 * Encode `null` to a `!null` inline extension
 */
function encodeNull(value: null): Extension {
  return { type: 'inline-extension', name: 'null' }
}

/**
 * Decode a `!true`, `!false`, `!boolean` inline extension to a `boolean`
 *
 * Valid booleans include (the first two are the preferred and the default,
 * the last should be avoided):
 *
 *   - `!true` or `!false`
 *   - `!boolean(true)` and `!boolean(1)`
 *   - `!boolean(false)` and `!boolean(0)`
 *   - `!boolean` (decoded to `true`)
 *   - `!boolean[true]` and `!boolean[1]` etc
 */
function decodeBoolean(ext: Extension): boolean {
  switch (ext.name) {
    case 'true':
      return true
    case 'false':
      return false
    default:
      const value = ext.argument || ext.content || 'true'
      return value === 'true' || value === '1' ? true : false
  }
}

/**
 * Encode a `boolean` to a `!true` or `!false`.
 */
function encodeBoolean(value: boolean): Extension {
  return { type: 'inline-extension', name: value ? 'true' : 'false' }
}

/**
 * Decode a `!number` inline extension to a `number`.
 *
 * Valid numbers include (the first is the preferred and the default,
 * the last should be avoided):
 *
 *   - `!number(3.14)`
 *   - `!number` (decoded to `0`)
 *   - `!number[3.14]`
 */
function decodeNumber(ext: Extension): number {
  return parseFloat(ext.argument || ext.content || '0')
}

/**
 * Encode a `number` to a `!number` inline extension
 */
function encodeNumber(value: number): Extension {
  return {
    type: 'inline-extension',
    name: 'number',
    argument: value.toString()
  }
}

/**
 * Decode an `!array` inline extension to an `Array`.
 *
 * Valid arrays include (the first is the preferred and the default,
 * the last should be avoided):
 *
 *   - `!array(1, 2)`
 *   - `!array` (decoded to `[]`)
 *   - `!array[1, 2]`
 */
function decodeArray(ext: Extension): Array<any> {
  const items = ext.argument || ext.content || ''
  const array = JSON5.parse(`[${items}]`)
  return array
}

/**
 * Encode an `array` to a `!array` inline extension
 */
function encodeArray(value: Array<any>): Extension {
  const argument = JSON5.stringify(value).slice(1, -1)
  return { type: 'inline-extension', name: 'array', argument }
}

/**
 * Decode an `!object` inline extension to an `Object`.
 *
 * Valid objects include (the first is the preferred and the default,
 * the last should be avoided):
 *
 *   - `!object("key":value, ...)` (comma separated pairs, values can be any JSON primitives)
 *   - `!object{key=string ...}` (space separated pairs; values can only be strings)
 *   - `!object` (decoded to `{}`)
 *   - `!object["key":"value", ...]`
 */
function decodeObject(ext: Extension): object {
  if (ext.properties) {
    // Extension properties always contain `className` and `id`, which may
    // be undefined, so drop them.
    const props: { [key: string]: any } = {}
    for (let [key, value] of Object.entries(ext.properties)) {
      // tslint:disable-next-line
      if (typeof value !== 'undefined') props[key] = value
    }
    if (Object.keys(props).length > 0) return props
  }
  return JSON5.parse(`{${ext.argument || ext.content}}`)
}

/**
 * Encode an `object` to a `!object` inline extension
 */
function encodeObject(value: object): Extension {
  const argument = JSON5.stringify(value).slice(1, -1)
  return { type: 'inline-extension', name: 'object', argument }
}

/**
 * Interface for generic extension nodes decoded by
 * [`remark-generic-extensions`](https://github.com/medfreeman/remark-generic-extensions)
 *
 * Inline extensions have the syntax:
 *
 * ```markdown
 * !Extension[Content](Argument){Properties}
 * ```
 *
 * Block extensions have the syntax:
 *
 * ```markdown
 * Extension: Argument
 * :::
 * [Content]
 * :::
 * {Properties}
 * ```
 */
interface Extension extends UNIST.Node {
  /**
   * Type of extension
   */
  type: 'inline-extension' | 'block-extension'

  /**
   * Name of the extension
   */
  name: string

  /**
   * Content (for inline extensions this is always text [but could be decoded as Markdown])
   */
  content?: string

  /**
   * Argument string
   */
  argument?: string

  /**
   * Map of computed properties
   */
  properties?: { [key: string]: string }
}

/**
 * Decode a generic extension into an MDAST node.
 */
function decodeExtension(
  type: 'inline-extension' | 'block-extension',
  element: Extension
) {
  return { type, ...element }
}

// These `stringify*` functions are for MDAST nodes that do not
// have a stringfier (often remark plugins only support transformation
// to HAST i.e. HTML and not serialization back to Markdown).
// They transform nodes to a `MDAST.HTML` node
// so that no escaping of the value is done.
// There is a more 'official' way to do this using a `unified.Codec`
// but the docs for that are not as good as for `Decoder` and after
// several attempts, this seemed like a more expedient, short term approach.

/**
 * Encode a generic extension node into a `MDAST.HTML` node.
 *
 * The `remark-generic-extensions` plugin does not do this stringifying for us.
 */
function stringifyExtensions(tree: UNIST.Node) {
  return map(tree, (node: any) => {
    if (node.type === 'inline-extension' || node.type === 'block-extension') {
      const props = Object.entries(node.properties || {})
        .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
        .join(' ')
      let value
      if (node.type === 'inline-extension') {
        value = `!${node.name}`
        if (node.content) value += `[${node.content}]`
        if (node.argument) value += `(${node.argument})`
        if (node.properties) value += `{${props}}`
      } else {
        value = `${node.name}:`
        if (node.argument) value += `${node.argument}`
        value += `\n:::\n[${node.content || ''}]\n:::\n`
        if (node.properties) value += `{${props}}`
      }
      return { type: 'html', value }
    }
    return node
  })
}

/**
 * Encode a `link` node with `data.hProperties` into a `MDAST.HTML` node
 * with attributes in curly braces `{}`.
 *
 * The `remark-attr` plugin does not do this stringifying for us
 * (it only works with `rehype`).
 */
function stringifyAttrs(tree: UNIST.Node) {
  const codec = unified().use(stringifier)
  const md = (node: UNIST.Node) => codec.stringify(node)
  return map(tree, (node: UNIST.Node) => {
    if (
      ['link', 'inlineCode'].includes(node.type) &&
      node.data &&
      node.data.hProperties
    ) {
      const meta = stringifyMeta(node.data.hProperties as {
        [key: string]: string
      })
      const value = `${md(node)}{${meta}}`
      return { type: 'html', value }
    }
    return node
  })
}

/**
 * Stringify a dictionary of meta data to be used as a code
 * block "infoString" or in bracketed attributes.
 */
function stringifyMeta(meta: { [key: string]: string }) {
  return Object.entries(meta)
    .map(([key, value]) => {
      let repr = key
      if (value) {
        repr += '='
        if (/\s/.test(value)) repr += '"' + value + '"'
        else repr += value
      }
      return repr
    })
    .join(' ')
}
