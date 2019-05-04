/**
 * # Markdown compiler
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
import * as MDAST from 'mdast'
// @ts-ignore
import compact from 'mdast-util-compact'
// @ts-ignore
import frontmatter from 'remark-frontmatter'
// @ts-ignore
import genericExtensionsParser from 'remark-generic-extensions'
// @ts-ignore
import parser from 'remark-parse'
// @ts-ignore
import stringifier from 'remark-stringify'
import unified from 'unified'
import * as UNIST from 'unist'
// @ts-ignore
import map from 'unist-util-map'
import { load, VFile } from './vfile'

export const mediaTypes = ['text/markdown', 'text/x-markdown']

/**
 * Options for `remark-frontmatter` parser and stringifier
 *
 * @see https://github.com/remarkjs/remark-frontmatter#matter
 */
const FRONTMATTER_OPTIONS = [{ type: 'yaml', marker: '-' }]

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
 * Parse a `VFile` with Markdown contents to a `stencila.Node`.
 *
 * @param file The `VFile` to parse
 * @returns A promise that resolves to a `stencila.Node`
 */
export async function parse(file: VFile): Promise<stencila.Node> {
  const extensionHandlers: { [key: string]: any } = {}
  for (let ext of GENERIC_EXTENSIONS) {
    extensionHandlers[ext] = { replace: parseExtension }
  }
  const mdast = unified()
    .use(parser, {
      commonmark: true
    })
    .use(frontmatter, FRONTMATTER_OPTIONS)
    .use(genericExtensionsParser, { elements: extensionHandlers })
    .parse(file)
  compact(mdast, true)
  return parseNode(mdast)
}

/**
 * Unparse a `stencila.Node` to a `VFile` with Markdown contents.
 *
 * @param thing The `stencila.Node` to unparse
 * @returns A promise that resolves to a `VFile`
 */
export async function unparse(node: stencila.Node): Promise<VFile> {
  let mdast = unparseNode(node)
  mdast = stringifyExtensions(mdast)
  const md = unified()
    .use(stringifier)
    .use(frontmatter, FRONTMATTER_OPTIONS)
    .stringify(mdast)
  return load(md)
}

function parseNode(node: UNIST.Node): stencila.Node {
  const type = node.type
  switch (type) {
    case 'root':
      return parseRoot(node as MDAST.Root)

    case 'heading':
      return parseHeading(node as MDAST.Heading)
    case 'paragraph':
      return parseParagraph(node as MDAST.Paragraph)
    case 'blockquote':
      return parseBlockquote(node as MDAST.Blockquote)
    case 'code':
      return parseCodeblock(node as MDAST.Code)
    case 'list':
      return parseList(node as MDAST.List)
    case 'table':
      return parseTable(node as MDAST.Table)
    case 'thematicBreak':
      return parseThematicBreak(node as MDAST.ThematicBreak)

    case 'link':
      return parseLink(node as MDAST.Link)
    case 'emphasis':
      return parseEmphasis(node as MDAST.Emphasis)
    case 'strong':
      return parseStrong(node as MDAST.Strong)
    case 'delete':
      return parseDelete(node as MDAST.Delete)
    case 'inlineCode':
      return parseInlineCode(node as MDAST.InlineCode)
    case 'text':
      return parseText(node as MDAST.Text)
    case 'inline-extension':
      const ext = (node as unknown) as Extension
      switch (ext.name) {
        case 'quote':
          return parseQuote(ext)

        case 'null':
          return parseNull(ext)
        case 'boolean':
        case 'true':
        case 'false':
          return parseBoolean(ext)
        case 'number':
          return parseNumber(ext)
        case 'array':
          return parseArray(ext)
        case 'object':
          return parseObject(ext)

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
      throw new Error(`No Markdown parser for MDAST node type "${type}"`)
  }
}

function unparseNode(node: stencila.Node): UNIST.Node {
  const type = stencila.type(node)
  switch (type) {
    case 'Article':
      return unparseArticle(node as stencila.Article)

    case 'Heading':
      return unparseHeading(node as stencila.Heading)
    case 'Paragraph':
      return unparseParagraph(node as stencila.Paragraph)
    case 'QuoteBlock':
      return unparseQuoteBlock(node as stencila.QuoteBlock)
    case 'CodeBlock':
      return unparseCodeBlock(node as stencila.CodeBlock)
    case 'List':
      return unparseList(node as stencila.List)
    case 'Table':
      return unparseTable(node as stencila.Table)
    case 'ThematicBreak':
      return unparseThematicBreak(node as stencila.ThematicBreak)

    case 'Link':
      return unparseLink(node as stencila.Link)
    case 'Emphasis':
      return unparseEmphasis(node as stencila.Emphasis)
    case 'Strong':
      return unparseStrong(node as stencila.Strong)
    case 'Delete':
      return unparseDelete(node as stencila.Delete)
    case 'Quote':
      return unparseQuote(node as stencila.Quote)
    case 'Code':
      return unparseCode(node as stencila.Code)

    case 'string':
      return unparseString(node as string)
    case 'null':
      return unparseNull(node as null)
    case 'boolean':
      return unparseBoolean(node as boolean)
    case 'number':
      return unparseNumber(node as number)
    case 'array':
      return unparseArray(node as Array<any>)
    case 'object':
      return unparseObject(node as object)

    default:
      throw new Error(`No Markdown unparser for Stencila node type "${type}"`)
  }
}

function unparseContent(node: stencila.Node): MDAST.Content {
  return unparseNode(node) as MDAST.Content
}

function parsePhrasingContent(
  node: MDAST.PhrasingContent
): stencila.InlineContent {
  return parseNode(node) as stencila.InlineContent
}

function unparseInlineContent(
  node: stencila.InlineContent
): MDAST.PhrasingContent {
  return unparseNode(node) as MDAST.PhrasingContent
}

function parseBlockContent(node: MDAST.BlockContent): stencila.BlockContent {
  return parseNode(node) as stencila.BlockContent
}

function unparseBlockContent(node: stencila.BlockContent): MDAST.BlockContent {
  return unparseNode(node) as MDAST.BlockContent
}

/**
 * Parse a `MDAST.root` node to a `stencila.Article`
 *
 * If the root has a front matter node (defined using YAML), that
 * meta data is added to the top level of the document. Other
 * child nodes are added to the article's `content` property.
 *
 * @param root The MDAST root to parse
 */
function parseRoot(root: MDAST.Root): stencila.Article {
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
      body.push(parseNode(child))
    }
  }
  article.content = body

  // TODO: remove the following which mutates any YAML
  // meta data to conform to the schema when above TODO is added
  return stencila.mutate(article, 'Article')
}

/**
 * Unparse a `stencila.Article` to a `MDAST.Root`
 *
 * The article's `content` property becomes the root's `children`
 * and any other properties are serialized as YAML
 * front matter and prepended to the children.
 *
 * @param node The Stencila article to unparse
 */
function unparseArticle(article: stencila.Article): MDAST.Root {
  const root: MDAST.Root = {
    type: 'root',
    children: []
  }

  // Unparse the article body
  if (article.content) {
    root.children = article.content.map(unparseContent)
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
 * Parse a `MDAST.Heading` to a `stencila.Heading`
 */
function parseHeading(heading: MDAST.Heading): stencila.Heading {
  return {
    type: 'Heading',
    depth: heading.depth,
    content: heading.children.map(parsePhrasingContent)
  }
}

/**
 * Unparse a `stencila.Heading` to a `MDAST.Heading`
 */
function unparseHeading(heading: stencila.Heading): MDAST.Heading {
  return {
    type: 'heading',
    depth: heading.depth as (1 | 2 | 3 | 4 | 5 | 6),
    children: heading.content.map(unparseInlineContent)
  }
}

/**
 * Parse a `MDAST.Paragraph` to a `stencila.Paragraph`
 */
function parseParagraph(paragraph: MDAST.Paragraph): stencila.Paragraph {
  return {
    type: 'Paragraph',
    content: paragraph.children.map(parsePhrasingContent)
  }
}

/**
 * Unparse a `stencila.Paragraph` to a `MDAST.Paragraph`
 */
function unparseParagraph(paragraph: stencila.Paragraph): MDAST.Paragraph {
  return {
    type: 'paragraph',
    children: paragraph.content.map(unparseInlineContent)
  }
}

/**
 * Parse a `MDAST.Blockquote` to a `stencila.QuoteBlock`
 */
function parseBlockquote(block: MDAST.Blockquote): stencila.QuoteBlock {
  return {
    type: 'QuoteBlock',
    content: block.children.map(parseBlockContent)
  }
}

/**
 * Unparse a `stencila.QuoteBlock` to a `MDAST.Blockquote`
 */
function unparseQuoteBlock(block: stencila.QuoteBlock): MDAST.Blockquote {
  return {
    type: 'blockquote',
    children: block.content.map(unparseBlockContent)
  }
}

/**
 * Parse a `MDAST.Code` to a `stencila.QuoteBlock`
 */
function parseCodeblock(block: MDAST.Code): stencila.CodeBlock {
  return {
    type: 'CodeBlock',
    language: block.lang,
    value: block.value
  }
}

/**
 * Unparse a `stencila.CodeBlock` to a `MDAST.Code`
 */
function unparseCodeBlock(block: stencila.CodeBlock): MDAST.Code {
  return {
    type: 'code',
    lang: block.language,
    value: block.value
  }
}

/**
 * Parse a `MDAST.List` to a `stencila.List`
 */
function parseList(list: MDAST.List): stencila.List {
  const items = []
  for (let item of list.children) {
    // TODO: when there are more than one child then create a stencila.Block
    let node = parseNode(item.children[0])

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
 * Unparse a `stencila.List` to a `MDAST.List`
 */
function unparseList(list: stencila.List): MDAST.List {
  return {
    type: 'list',
    ordered: list.order === 'ascending',
    children: list.items.map(
      (item: stencila.Node): MDAST.ListItem => {
        // TODO: wrap anything that is not inline content into a block e.g. para
        const first = unparseNode(item) as MDAST.BlockContent
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
 * Parse a `MDAST.Table` to a `stencila.Table`
 */
function parseTable(table: MDAST.Table): stencila.Table {
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
                content: cell.children.map(parsePhrasingContent)
              }
            }
          )
        }
      }
    )
  }
}

/**
 * Unparse a `stencila.Table` to a `MDAST.Table`
 */
function unparseTable(table: stencila.Table): MDAST.Table {
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
                children: cell.content.map(unparseInlineContent)
              }
            }
          )
        }
      }
    )
  }
}

/**
 * Parse a `MDAST.ThematicBreak` to a `stencila.ThematicBreak`
 */
function parseThematicBreak(
  tbreak: MDAST.ThematicBreak
): stencila.ThematicBreak {
  return {
    type: 'ThematicBreak'
  }
}

/**
 * Unparse a `stencila.ThematicBreak` to a `MDAST.ThematicBreak`
 */
function unparseThematicBreak(
  tbreak: stencila.ThematicBreak
): MDAST.ThematicBreak {
  return {
    type: 'thematicBreak'
  }
}

/**
 * Parse a `MDAST.Link` to a `stencila.Link`
 */
function parseLink(link: MDAST.Link): stencila.Link {
  return {
    type: 'Link',
    target: link.url,
    content: link.children.map(parsePhrasingContent)
  }
}

/**
 * Unparse a `stencila.Link` to a `MDAST.Link`
 */
function unparseLink(link: stencila.Link): MDAST.Link {
  return {
    type: 'link',
    url: link.target,
    children: link.content.map(
      node => unparseInlineContent(node) as MDAST.StaticPhrasingContent
    )
  }
}

/**
 * Parse a `MDAST.Emphasis` to a `stencila.Emphasis`
 */
function parseEmphasis(emphasis: MDAST.Emphasis): stencila.Emphasis {
  return {
    type: 'Emphasis',
    content: emphasis.children.map(parsePhrasingContent)
  }
}

/**
 * Unparse a `stencila.Emphasis` to a `MDAST.Emphasis`
 */
function unparseEmphasis(emphasis: stencila.Emphasis): MDAST.Emphasis {
  return {
    type: 'emphasis',
    children: emphasis.content.map(unparseInlineContent)
  }
}

/**
 * Parse a `MDAST.Strong` to a `stencila.Strong`
 */
function parseStrong(strong: MDAST.Strong): stencila.Strong {
  return {
    type: 'Strong',
    content: strong.children.map(parsePhrasingContent)
  }
}

/**
 * Unparse a `stencila.Strong` to a `MDAST.Strong`
 */
function unparseStrong(strong: stencila.Strong): MDAST.Strong {
  return {
    type: 'strong',
    children: strong.content.map(unparseInlineContent)
  }
}

/**
 * Parse a `MDAST.Delete` to a `stencila.Delete`
 */
function parseDelete(delet: MDAST.Delete): stencila.Delete {
  return {
    type: 'Delete',
    content: delet.children.map(parsePhrasingContent)
  }
}

/**
 * Unparse a `stencila.Delete` to a `MDAST.Delete`
 */
function unparseDelete(delet: stencila.Delete): MDAST.Delete {
  return {
    type: 'delete',
    children: delet.content.map(unparseInlineContent)
  }
}

/**
 * Parse a `!quote` inline extension to a `Quote`.
 *
 * Valid quotes include:
 *
 *   - `!quote[Quoted content]`
 *   - `!quote[Quoted content with _emphasis_](https://example.org)`
 */
function parseQuote(ext: Extension): stencila.Quote {
  const quote: stencila.Quote = {
    type: 'Quote',
    // TODO: possibly parse the ext.content as Markdown?
    content: ext.content ? [ext.content] : []
  }
  const cite = ext.argument
  if (cite) quote.citation = cite
  return quote
}

/**
 * Unparse a `stencila.Quote` to a `!quote` inline extension
 */
function unparseQuote(quote: stencila.Quote): Extension {
  return {
    type: 'inline-extension',
    name: 'quote',
    // TODO: Handle cases where content is more than one string
    content: quote.content[0] as string,
    argument: quote.citation
  }
}

/**
 * Parse a `MDAST.InlineCode` to a `stencila.Code`
 */
function parseInlineCode(inlineCode: MDAST.InlineCode): stencila.Code {
  return {
    type: 'Code',
    value: inlineCode.value
  }
}

/**
 * Unparse a `stencila.Code` to a `MDAST.InlineCode`
 */
function unparseCode(code: stencila.Code): MDAST.InlineCode {
  return {
    type: 'inlineCode',
    value: code.value
  }
}

/**
 * Parse a `MDAST.Text` to a `string`
 */
function parseText(text: MDAST.Text): string {
  return text.value
}

/**
 * Unparse a `string` to a `MDAST.Text`
 */
function unparseString(value: string): MDAST.Text {
  return { type: 'text', value }
}

/**
 * Parse a `!null` inline extension to `null`
 */
function parseNull(ext: Extension): null {
  return null
}

/**
 * Unparse `null` to a `!null` inline extension
 */
function unparseNull(value: null): Extension {
  return { type: 'inline-extension', name: 'null' }
}

/**
 * Parse a `!true`, `!false`, `!boolean` inline extension to a `boolean`
 *
 * Valid booleans include (the first two are the preferred and the default,
 * the last should be avoided):
 *
 *   - `!true` or `!false`
 *   - `!boolean(true)` and `!boolean(1)`
 *   - `!boolean(false)` and `!boolean(0)`
 *   - `!boolean` (parsed to `true`)
 *   - `!boolean[true]` and `!boolean[1]` etc
 */
function parseBoolean(ext: Extension): boolean {
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
 * Unparse a `boolean` to a `!true` or `!false`.
 */
function unparseBoolean(value: boolean): Extension {
  return { type: 'inline-extension', name: value ? 'true' : 'false' }
}

/**
 * Parse a `!number` inline extension to a `number`.
 *
 * Valid numbers include (the first is the preferred and the default,
 * the last should be avoided):
 *
 *   - `!number(3.14)`
 *   - `!number` (parsed to `0`)
 *   - `!number[3.14]`
 */
function parseNumber(ext: Extension): number {
  return parseFloat(ext.argument || ext.content || '0')
}

/**
 * Unparse a `number` to a `!number` inline extension
 */
function unparseNumber(value: number): Extension {
  return {
    type: 'inline-extension',
    name: 'number',
    argument: value.toString()
  }
}

/**
 * Parse an `!array` inline extension to an `Array`.
 *
 * Valid arrays include (the first is the preferred and the default,
 * the last should be avoided):
 *
 *   - `!array(1, 2)`
 *   - `!array` (parsed to `[]`)
 *   - `!array[1, 2]`
 */
function parseArray(ext: Extension): Array<any> {
  const items = ext.argument || ext.content || ''
  const array = JSON.parse(`[${items}]`)
  return array
}

/**
 * Unparse an `array` to a `!array` inline extension
 */
function unparseArray(value: Array<any>): Extension {
  const argument = JSON.stringify(value).slice(1, -1)
  return { type: 'inline-extension', name: 'array', argument }
}

/**
 * Parse an `!object` inline extension to an `Object`.
 *
 * Valid objects include (the first is the preferred and the default,
 * the last should be avoided):
 *
 *   - `!object("key":value, ...)` (comma separated pairs, values can be any JSON primitives)
 *   - `!object{key=string ...}` (space separated pairs; values can only be strings)
 *   - `!object` (parsed to `{}`)
 *   - `!object["key":"value", ...]`
 */
function parseObject(ext: Extension): object {
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
  return JSON.parse(`{${ext.argument || ext.content}}`)
}

/**
 * Unparse an `object` to a `!object` inline extension
 */
function unparseObject(value: object): Extension {
  const argument = JSON.stringify(value).slice(1, -1)
  return { type: 'inline-extension', name: 'object', argument }
}

/**
 * Interface for generic extension nodes parsed by
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
   * Content (for inline extensions this is always text [but could be parsed as Markdown])
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
 * Parse a generic extension into an MDAST node.
 */
function parseExtension(
  type: 'inline-extension' | 'block-extension',
  element: Extension
) {
  return { type, ...element }
}

/**
 * Unparse a generic extension node into a `MDAST.HTML` node.
 *
 * The `remark-generic-extensions` does not do this stringifying for us.
 * We transform each to a `MDAST.HTML` node so that no escaping of the value is done
 * while stringifying.
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
