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
 * Parse a `VFile` with Markdown contents to a `stencila.Node`.
 *
 * @param file The `VFile` to parse
 * @returns A promise that resolves to a `stencila.Node`
 */
export async function parse(file: VFile): Promise<stencila.Node> {
  const mdast = unified()
    .use(parser, {
      commonmark: true
    })
    .use(frontmatter, FRONTMATTER_OPTIONS)
    .use(genericExtensionsParser, GENERIC_EXTENSIONS)
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

/******************************************************************************
 * Transformation functions
 *
 * These functions transform nodes from a [Markdown Abstract Syntax Tree](https://github.com/syntax-tree/mdast) to
 * nodes in a [Stencila Document Tree](https://github.com/stencila/schema).
 *
 * Functions are in pairs:
 *
 *   - `parseX(MDAST.X): stencila.Y`: for parsing the MDAST node type `X`
 *                                    to Stencila node type `Y`
 *   - `unparseY(stencila.Y): MDAST.X`: for unparsing Stencila node type `Y`
 *                                      to Stencila node type `X`
 *****************************************************************************/

function parseNode(node: UNIST.Node): stencila.Node {
  const type = node.type
  switch (type) {
    case 'root':
      return parseRoot(node as MDAST.Root)
    // Block content
    case 'heading':
      return parseHeading(node as MDAST.Heading)
    case 'paragraph':
      return parseParagraph(node as MDAST.Paragraph)
    case 'blockquote':
      return parseBlockquote(node as MDAST.Blockquote)
    case 'thematicBreak':
      return parseThematicBreak(node as MDAST.ThematicBreak)
    // Inline content
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
    // Block content
    case 'Heading':
      return unparseHeading(node as stencila.Heading)
    case 'Paragraph':
      return unparseParagraph(node as stencila.Paragraph)
    case 'Blockquote':
      return unparseBlockquote(node as stencila.Blockquote)
    case 'ThematicBreak':
      return unparseThematicBreak(node as stencila.ThematicBreak)
    // Inline content
    case 'Emphasis':
      return unparseEmphasis(node as stencila.Emphasis)
    case 'Strong':
      return unparseStrong(node as stencila.Strong)
    case 'Delete':
      return unparseDelete(node as stencila.Delete)
    case 'Verbatim':
      return unparseVerbatim(node as stencila.Verbatim)
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

// TODO: stencila.InlineContent should be exported?
type stencilaInlineContent =
  | null
  | boolean
  | number
  | string
  | stencila.Emphasis
  | stencila.Strong
  | stencila.Delete
  | stencila.Verbatim
  | stencila.Expression

function parsePhrasingContent(
  node: MDAST.PhrasingContent
): stencilaInlineContent {
  return parseNode(node) as stencilaInlineContent
}

function unparseInlineContent(
  node: stencilaInlineContent
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
 * child nodes are added to the article's `articleBody` property.
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
  article.articleBody = body

  // TODO: remove the following which mutates any YAML
  // meta data to conform to the schema when above TODO is added
  return stencila.mutate(article, 'Article')
}

/**
 * Unparse a `stencila.Article` to a `MDAST.Root`
 *
 * The article's `articleBody` property becomes the root's `children`
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
  if (article.articleBody) {
    root.children = article.articleBody.map(unparseContent)
  }

  // Add other properties as frontmatter
  const frontmatter: { [key: string]: any } = {}
  for (let [key, value] of Object.entries(article)) {
    if (!['type', 'articleBody'].includes(key)) {
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
 * Parse a `MDAST.Blockquote` to a `stencila.Blockquote`
 */
function parseBlockquote(paragraph: MDAST.Blockquote): stencila.Blockquote {
  return {
    type: 'Blockquote',
    content: paragraph.children.map(parseBlockContent)
  }
}

/**
 * Unparse a `stencila.Blockquote` to a `MDAST.Blockquote`
 */
function unparseBlockquote(paragraph: stencila.Blockquote): MDAST.Blockquote {
  return {
    type: 'blockquote',
    children: paragraph.content.map(unparseBlockContent)
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
 * Parse a `MDAST.InlineCode` to a `stencila.Verbatim`
 */
function parseInlineCode(inlineCode: MDAST.InlineCode): stencila.Verbatim {
  return {
    type: 'Verbatim',
    value: inlineCode.value
  }
}

/**
 * Unparse a `stencila.Verbatim` to a `MDAST.InlineCode`
 */
function unparseVerbatim(verbatim: stencila.Verbatim): MDAST.InlineCode {
  return {
    type: 'inlineCode',
    value: verbatim.value
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
 * Unparse a `boolean` to a `!boolean` inline extension
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

/******************************************************************************
 * Handling of custom Markdown extensions
 *
 * See https://github.com/medfreeman/remark-generic-extensions
 *
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
 *****************************************************************************/

/**
 * Interface for generic extension nodes parsed by `remark-generic-extensions`.
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
   * Content string
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
 * Generic extensions definitions.
 *
 * @see https://github.com/medfreeman/remark-generic-extensions#elements-object
 */
const GENERIC_EXTENSIONS = {
  elements: {
    null: { replace: parseExtension },
    boolean: { replace: parseExtension },
    true: { replace: parseExtension },
    false: { replace: parseExtension },
    number: { replace: parseExtension },
    array: { replace: parseExtension },
    object: { replace: parseExtension }
  }
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
