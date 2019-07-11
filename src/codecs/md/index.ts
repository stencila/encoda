/**
 * @module md
 */

import { getLogger } from '@stencila/logga'
import stencila from '@stencila/schema'
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
// @ts-ignore
import { selectAll } from 'unist-util-select'

import { Encode } from '../..'
import { isBlockContent, isNode } from '../../util/index'
import type from '../../util/type'
import * as vfile from '../../util/vfile'

const logger = getLogger('encoda:md')

export const mediaTypes = ['text/markdown', 'text/x-markdown']

export const mdastBlockContentTypes: {
  [key in MDAST.BlockContent['type']]: key
} = {
  blockquote: 'blockquote',
  code: 'code',
  heading: 'heading',
  html: 'html',
  list: 'list',
  paragraph: 'paragraph',
  table: 'table',
  thematicBreak: 'thematicBreak'
}

const isMdastBlockContent = isNode<MDAST.BlockContent>(mdastBlockContentTypes)

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
  'expr',
  'chunk',

  'null',
  'true',
  'false',
  'boolean',
  'number',
  'array',
  'object'
]
const extensionHandlers: { [key: string]: any } = {}
for (let ext of GENERIC_EXTENSIONS) {
  extensionHandlers[ext] = { replace: decodeExtension }
}

/**
 * Decode a `VFile` with Markdown contents to a `stencila.Node`.
 *
 * @param file The `VFile` to decode
 * @returns A promise that resolves to a `stencila.Node`
 */
export async function decode(file: vfile.VFile): Promise<stencila.Node> {
  const md = await vfile.dump(file)
  return decodeMarkdown(md)
}

/**
 * Encode a `stencila.Node` to a `VFile` with Markdown contents.
 *
 * @param thing The `stencila.Node` to encode
 * @returns A promise that resolves to a `VFile`
 */
export const encode: Encode = async (
  node: stencila.Node
): Promise<vfile.VFile> => {
  const md = encodeMarkdown(node)
  return vfile.load(md)
}

/**
 * Decode a string of Markdown content to a Stencila `Node`
 */
export function decodeMarkdown(md: string): stencila.Node {
  const mdast = unified()
    .use(parser, {
      commonmark: true
    })
    .use(attrs, { scope: 'permissive' })
    .use(frontmatter, FRONTMATTER_OPTIONS)
    .use(attrs, ATTR_OPTIONS)
    .use(genericExtensions, { elements: extensionHandlers })
    .parse(md)
  compact(mdast, true)
  return decodeNode(resolveReferences(mdast))
}

/**
 * Encode a Stencila `Node` to a Markdown `string`.
 */
export function encodeMarkdown(node: stencila.Node): string {
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
  return md
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
    case 'listItem':
      return decodeListItem(node as MDAST.ListItem)
    case 'table':
      return decodeTable(node as MDAST.Table)
    case 'thematicBreak':
      return decodeThematicBreak()

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
    case 'block-extension':
      const ext = (node as unknown) as Extension
      switch (ext.name) {
        case 'chunk':
          return decodeCodeChunk(ext)

        case 'quote':
          return decodeQuote(ext)

        case 'null':
          return decodeNull()
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
    case 'html':
      return decodeHTML(node as MDAST.HTML)

    default:
      logger.warn(`No Markdown decoder for MDAST node type "${type}"`)
      return ''
  }
}

function encodeNode(node: stencila.Node): UNIST.Node | undefined {
  const type_ = type(node)
  switch (type_) {
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
    case 'CodeChunk':
      return encodeCodeChunk(node as stencila.CodeChunk)
    case 'List':
      return encodeList(node as stencila.List)
    case 'ListItem':
      return encodeListItem(node as stencila.ListItem)
    case 'Table':
      return encodeTable(node as stencila.Table)
    case 'ThematicBreak':
      return encodeThematicBreak()

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
    case 'CodeExpr':
      return encodeCodeExpr(node as stencila.CodeExpr)
    case 'ImageObject':
      return encodeImageObject(node as stencila.ImageObject)

    case 'string':
      return encodeString(node as string)
    case 'null':
      return encodeNull()
    case 'boolean':
      return encodeBoolean(node as boolean)
    case 'number':
      return encodeNumber(node as number)
    case 'array':
      return encodeArray(node as any[])
    case 'object':
      return encodeObject(node as object)

    default:
      throw new Error(`No Markdown encoder for Stencila node type "${type_}"`)
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
  const article: stencila.Article = {
    type: 'Article',
    title: 'Untitled',
    // TODO: the `create function should automatically add empty
    // array for array properties that are required
    authors: []
  }

  const body: stencila.Node[] = []
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

  return article
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
      value: yaml.safeDump(frontmatter, { skipInvalid: true }).trim()
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
      type(content[0]) === 'string' &&
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
function decodeCodeblock(code: MDAST.Code): stencila.CodeBlock {
  const codeBlock: stencila.CodeBlock = {
    type: 'CodeBlock',
    value: code.value
  }
  if (code.lang) codeBlock.language = code.lang
  // The `remark-attrs` plugin parses metadata from the info string
  // into `data.hProperties` but also (erroneously?) seems to
  // parse some of the content of the first line of code so
  // we ensure that `code.meta` (unparsed info string) is present.
  const meta =
    code.meta &&
    code.data &&
    (code.data.hProperties as { [key: string]: string })
  if (meta) codeBlock.meta = meta
  return codeBlock
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
 * Decode a `chunk:` block extension to a `stencila.CodeChunk`
 */
function decodeCodeChunk(ext: Extension): stencila.CodeChunk {
  const codeChunk: stencila.CodeChunk = {
    type: 'CodeChunk'
  }
  if (ext.content) {
    const article = decodeMarkdown(ext.content) as stencila.Article
    const nodes = (article.content && article.content) || []
    const first = nodes[0]
    if (type(first) === 'CodeBlock') {
      const codeBlock = first as stencila.CodeBlock
      const { language, meta, value } = codeBlock
      if (language) codeChunk.programmingLanguage = language
      if (meta) codeChunk.meta = meta
      if (value) codeChunk.text = value
    }
  }
  return codeChunk
}

/**
 * Encode a `stencila.CodeChunk` to a `chunk:` block extension
 */
function encodeCodeChunk(chunk: stencila.CodeChunk): Extension {
  const { programmingLanguage, meta, text, outputs } = chunk
  const nodes: stencila.Node[] = []

  // Encode the code as a `CodeBlock` with `meta`
  const codeBlock: stencila.CodeBlock = {
    type: 'CodeBlock',
    language: programmingLanguage || 'text',
    meta,
    value: text || ''
  }
  nodes.push(codeBlock)

  // Separate the `output` with a `ThematicBreak`
  if (outputs && outputs.length) {
    let index = 0
    for (const output of outputs) {
      if (index !== 0) nodes.push({ type: 'ThematicBreak' })
      nodes.push(output)
      index += 1
    }
  }

  // Encode nodes as Markdown
  const md = encodeMarkdown({ type: 'Article', content: nodes }).trim()

  return {
    type: 'block-extension',
    name: 'chunk',
    content: md
  }
}

/**
 * Decode a `MDAST.List` to a `stencila.List`
 */
function decodeList(list: MDAST.List): stencila.List {
  return {
    type: 'List',
    order: list.ordered ? 'ascending' : 'unordered',
    items: list.children
      .map(decodeNode)
      .filter(isNode<stencila.ListItem>({ ListItem: 'ListItem' }))
  }
}

/**
 * Encode a `stencila.List` to a `MDAST.List`
 */
function encodeList(list: stencila.List): MDAST.List {
  return {
    type: 'list',
    ordered: list.order === 'ascending',
    children: list.items
      .filter(isNode<stencila.ListItem>({ ListItem: 'ListItem' }))
      .map(encodeListItem)
  }
}

/**
 * Encode a `MDAST.ListItem` to a `stencila.ListItem`
 */
function encodeListItem(listItem: stencila.ListItem): MDAST.ListItem {
  // TODO: This is required to make TypeDoc happy, since it uses an older version of TypeScript.
  // It should be removed once TypeDoc is updated
  const enum type {
    listItem = 'listItem'
  }

  const encoded = {
    type: type.listItem,
    children: listItem.content.map(encodeNode).filter(isMdastBlockContent)
  }

  return listItem.checked === true || listItem.checked === false
    ? { ...encoded, checked: listItem.checked }
    : encoded
}

/**
 * Decode a `MDAST.List` to a `stencila.List`
 */
function decodeListItem(listItem: MDAST.ListItem): stencila.ListItem {
  // TODO: This is required to make TypeDoc happy, since it uses an older version of TypeScript.
  // It should be removed once TypeDoc is updated
  const enum type {
    ListItem = 'ListItem'
  }

  const _listItem = {
    type: type.ListItem,
    content: listItem.children.map(decodeNode).filter(isBlockContent)
  }

  return listItem.checked === true || listItem.checked === false
    ? { ..._listItem, checked: listItem.checked || false }
    : _listItem
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
function decodeThematicBreak(): stencila.ThematicBreak {
  return {
    type: 'ThematicBreak'
  }
}

/**
 * Encode a `stencila.ThematicBreak` to a `MDAST.ThematicBreak`
 */
function encodeThematicBreak(): MDAST.ThematicBreak {
  return {
    type: 'thematicBreak'
  }
}

/**
 * Decode a `MDAST.Link` to a `stencila.Link`
 */
function decodeLink(link: MDAST.Link): stencila.Link {
  const link_: stencila.Link = {
    type: 'Link',
    target: link.url,
    content: link.children.map(decodePhrasingContent)
  }
  // The `remark-attrs` plugin decodes curly brace attributes to `data.hProperties`
  const meta = (link.data && link.data.hProperties) as {
    [key: string]: string
  }
  if (meta) link_.meta = meta
  return link_
}

/**
 * Encode a `stencila.Link` to a `MDAST.Link`
 */
function encodeLink(link: stencila.Link): MDAST.Link {
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
 * Decode a `MDAST.InlineCode` to either a static `stencila.Code`
 * or an executable `stencila.CodeExpr`.
 */
function decodeInlineCode(
  inlineCode: MDAST.InlineCode
): stencila.Code | stencila.CodeExpr {
  const attrs =
    inlineCode.data &&
    (inlineCode.data.hProperties as { [key: string]: string })

  if (attrs && attrs.type === 'expr') {
    const codeExpr: stencila.CodeExpr = {
      type: 'CodeExpr',
      text: inlineCode.value
    }
    const { type, lang, ...rest } = attrs
    if (lang) codeExpr.programmingLanguage = lang
    if (Object.keys(rest).length) codeExpr.meta = rest
    return codeExpr
  } else {
    const code: stencila.Code = {
      type: 'Code',
      value: inlineCode.value
    }
    if (attrs) {
      const { lang, ...rest } = attrs
      if (lang) code.language = lang
      if (Object.keys(rest).length) code.meta = rest
    }
    return code
  }
}

/**
 * Encode a `stencila.Code` node to a `MDAST.InlineCode`
 */
function encodeCode(code: stencila.Code): MDAST.InlineCode {
  let attrs
  if (code.language) attrs = { lang: code.language }
  if (code.meta) attrs = { ...attrs, ...code.meta }
  return {
    type: 'inlineCode',
    data: { hProperties: attrs },
    value: code.value
  }
}

/**
 * Encode a `stencila.CodeExpr` to a `MDAST.InlineCode` with
 * `{type=expr}`
 */
function encodeCodeExpr(codeExpr: stencila.CodeExpr): MDAST.InlineCode {
  let attrs = {
    type: 'expr',
    lang: codeExpr.programmingLanguage,
    ...codeExpr.meta
  }
  return {
    type: 'inlineCode',
    data: { hProperties: attrs },
    value: codeExpr.text || ''
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
  const meta =
    image.data && (image.data.hProperties as { [key: string]: string })
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
  if (imageObject.meta) image.data = { hProperties: imageObject.meta }
  return image
}

/**
 * Decode a `MDAST.Text` to a `string`.
 *
 * Replaces newline and carriage returns with a space.
 * This is done to ensure that paragraphs that are written
 * across multiple lines do not have newlines in them.
 */
function decodeText(text: MDAST.Text): string {
  return text.value.replace(/[\r\n]+/g, ' ')
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
function decodeNull(): null {
  return null
}

/**
 * Encode `null` to a `!null` inline extension
 */
function encodeNull(): Extension {
  return { type: 'inline-extension', name: 'null' }
}

/**
 * Decode a `!true`, `!false`, `!boolean` inline extension to a `boolean`
 *
 * Valid booleans include (the first three are the preferred and the default,
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
      return !!(value === 'true' || value === '1')
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
function decodeArray(ext: Extension): any[] {
  const items = ext.argument || ext.content || ''
  const array = JSON5.parse(`[${items}]`)
  return array
}

/**
 * Encode an `array` to a `!array` inline extension
 */
function encodeArray(value: any[]): Extension {
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
// have a stringifier (often remark plugins only support transformation
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
        value += `\n:::\n${node.content || ''}\n:::`
        if (node.properties) value += `{${props}}`
      }
      return { type: 'html', value }
    }
    return node
  })
}

/**
 * Decode a `MDAST.HTML` to a stencila `Node`
 *
 * At present this just returns the raw HTML.
 */
function decodeHTML(html: MDAST.HTML): string {
  // TODO: Make this function async and and return
  // the decoded HTML i.e. `return load(html.value, 'html')`
  return html.value
}

/**
 * Encode a `link` node with `data.hProperties` into a `MDAST.HTML` node
 * with attributes in curly braces `{}`.
 *
 * The `remark-attr` plugin does not do this stringifying for us
 * (it only works with `rehype`).
 */
function stringifyAttrs(tree: UNIST.Node) {
  const types = ['heading', 'code', 'link', 'inlineCode', 'image']
  const codec = unified().use(stringifier)
  const md = (node: UNIST.Node) => codec.stringify(node)
  return map(tree, (node: UNIST.Node) => {
    if (types.includes(node.type) && node.data && node.data.hProperties) {
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

/**
 * Resolve link and image references by finding the
 * associated `definition` node, using it's URL
 * and then removing it from the tree.
 */
function resolveReferences(tree: UNIST.Node): UNIST.Node {
  const definitions = selectAll('definition', tree).reduce(
    (prev: { [key: string]: string }, node: MDAST.Definition) => {
      prev[node.identifier] = node.url
      return prev
    },
    {}
  )
  return filter(
    map(tree, (node: UNIST.Node) => {
      switch (node.type) {
        case 'linkReference': {
          const { identifier, children } = node as MDAST.LinkReference
          const url = definitions[identifier] || ''
          const link: MDAST.Link = { type: 'link', url, children }
          return link
        }
        case 'imageReference': {
          const { identifier, alt } = node as MDAST.ImageReference
          const url = definitions[identifier] || ''
          const image: MDAST.Image = { type: 'image', url, alt }
          return image
        }
      }
      return node
    }),
    (node: UNIST.Node) => node.type !== 'definition'
  )
}
