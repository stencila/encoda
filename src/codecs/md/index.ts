/**
 * @module md
 */

/**
 * Hello contributor 👋! If you are working on this file, please
 * endeavor to remove the need for the following `eslint-disable` line 🙏.
 * Remove the line and run `npx eslint path/to/this/file.ts` to
 * see which code needs some linting ❤️.
 * See https://github.com/stencila/encoda/issues/199 for suggestions
 * on how to refactor code to avoid non-strict boolean expressions.
 */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */

import { getLogger } from '@stencila/logga'
import stencila, {
  isA,
  isBlockContent,
  isCreativeWork,
  isListItem,
  nodeIs,
  nodeType,
  TypeMapGeneric,
} from '@stencila/schema'
import fs from 'fs'
import * as yaml from 'js-yaml'
import JSON5 from 'json5'
import * as MDAST from 'mdast'
// @ts-ignore
import compact from 'mdast-util-compact'
import path from 'path'
// @ts-ignore
import attrs from 'remark-attr'
import frontmatter from 'remark-frontmatter'
// @ts-ignore
import genericExtensions from 'remark-generic-extensions'
// @ts-ignore
import math from 'remark-math'
import parser from 'remark-parse'
import stringifier from 'remark-stringify'
// @ts-ignore
import subSuper from 'remark-sub-super'
import unified from 'unified'
import * as UNIST from 'unist'
import filter from 'unist-util-filter'
import map from 'unist-util-map'
import { selectAll } from 'unist-util-select'
import { STDIO_PATH } from '../..'
import { ensureInlineContentArray } from '../../util/content/ensureInlineContentArray'
import { isContentArray } from '../../util/content/isContentArray'
import { encodeCitationText } from '../../util/references'
import transform from '../../util/transform'
import * as vfile from '../../util/vfile'
import { BibCodec } from '../bib'
import { HTMLCodec } from '../html'
import { TexCodec } from '../tex'
import { TxtCodec } from '../txt'
import { Codec, CommonDecodeOptions, CommonEncodeOptions } from '../types'
import { citePlugin } from './plugins/cite'
import { stringifyHTML } from './stringifyHtml'

const texCodec = new TexCodec()
const bibCodec = new BibCodec()

export const log = getLogger('encoda:md')

export class MdCodec extends Codec implements Codec {
  public readonly mediaTypes = ['text/markdown', 'text/x-markdown']

  /**
   * Decode a `VFile` with Markdown contents to a `stencila.Node`.
   *
   * @param file The `VFile` to decode
   * @returns A promise that resolves to a `stencila.Node`
   */
  public readonly decode = async (
    file: vfile.VFile,
    options: CommonDecodeOptions = this.commonDecodeDefaults
  ): Promise<stencila.Node> => {
    const { isStandalone } = options
    const md = await vfile.dump(file)
    return decodeRootArticle(md, file.path, isStandalone)
  }

  /**
   * Encode a `stencila.Node` to a `VFile` with Markdown contents.
   *
   * @param thing The `stencila.Node` to encode
   * @returns A promise that resolves to a `VFile`
   */
  public readonly encode = async (
    node: stencila.Node,
    options: CommonEncodeOptions = this.commonEncodeDefaults
  ): Promise<vfile.VFile> => {
    const prepared = await encodePrepare(node, options)
    const md = encodeMarkdown(prepared)
    return Promise.resolve(vfile.load(md))
  }
}

/**
 * Matches new lines, **the preceding character**, and any following white space
 * on the next line. This so so that trailing spaces can be collapsed into a space.
 * To use you need to include the matched group in the replacement value.
 * @see https://regexr.com/4i45o
 * @see https://stackoverflow.com/a/18012521
 * @example myString.replace(whiteSpaceRegEx, '$1 ')
 */

const whiteSpaceRegEx = new RegExp(/(^|[^\n\s])[\n]+\s*(?![\n])/g)

export const mdastBlockContentTypes: TypeMapGeneric<MDAST.BlockContent> = {
  blockquote: 'blockquote',
  code: 'code',
  heading: 'heading',
  html: 'html',
  list: 'list',
  paragraph: 'paragraph',
  table: 'table',
  thematicBreak: 'thematicBreak',
}

export const mdastPhrasingContentTypes: TypeMapGeneric<MDAST.PhrasingContent> = {
  break: 'break',
  delete: 'delete',
  emphasis: 'emphasis',
  footnote: 'footnote',
  footnoteReference: 'footnoteReference',
  html: 'html',
  image: 'image',
  imageReference: 'imageReference',
  inlineCode: 'inlineCode',
  link: 'link',
  linkReference: 'linkReference',
  strong: 'strong',
  text: 'text',
}

const isMdastBlockContent = nodeIs(mdastBlockContentTypes)
const isMdastPhrasingContent = nodeIs(mdastPhrasingContentTypes)

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
 * Registered generic extensions.
 *
 * @see Extension
 */
const GENERIC_EXTENSIONS = [
  'quote',
  'expr',
  'chunk',
  'figure',
  'table',
  'include',

  'null',
  'true',
  'false',
  'boolean',
  'number',
  'array',
  'object',
]
const extensionHandlers: { [key: string]: any } = {}
for (const ext of GENERIC_EXTENSIONS) {
  extensionHandlers[ext] = { replace: decodeExtension }
}

/**
 * Decode a string of Markdown content to a `UNIST.Node`
 */
export function stringToMdast(content: string): UNIST.Node {
  const mdast = unified()
    .use(parser, { commonmark: true })
    .use(frontmatter, FRONTMATTER_OPTIONS)
    .use(attrs, ATTR_OPTIONS)
    .use(subSuper)
    .use(math)
    .use(citePlugin)
    .use(genericExtensions, { elements: extensionHandlers })
    .parse(content)

  compact(mdast, true)

  return mdast
}

type Frontmatter = Record<string | number, unknown>

interface DecodeContext {
  frontmatter: Partial<
    Exclude<stencila.CreativeWork, 'content'> & { bibliography: string }
  >
}

/**
 * Decode a string of Markdown content to a Stencila `Node`
 */
export function decodeMarkdown(md: string): stencila.Article {
  const mdast = stringToMdast(md)
  const root = stringifyHTML(resolveReferences(mdast)) as MDAST.Root
  const frontmatter = loadFrontmatter(root)

  const context: DecodeContext = {
    frontmatter,
  }
  return decodeArticle(root, context)
}

/**
 * An async variant of `decodeMarkdown` specialized to decoding the top-level `Article` Markdown contents.
 * During the decoding checks the frontmatter for a `bibliography` key pointing to a separate bibliographic file.
 * If it exists, reads in the file to populate the decoding `context`.
 */
async function decodeRootArticle(
  content: string,
  filePath?: string,
  isStandalone = true
): Promise<stencila.Article | stencila.Node[]> {
  const mdast = stringToMdast(content)
  const root = stringifyHTML(resolveReferences(mdast)) as MDAST.Root
  const frontmatter = loadFrontmatter(root)

  const references =
    typeof frontmatter.bibliography === 'string' && filePath !== undefined
      ? await inlineReferences(filePath, frontmatter.bibliography)
      : Array.isArray(frontmatter.references)
      ? frontmatter.references
      : undefined

  const context: DecodeContext = {
    frontmatter: {
      ...frontmatter,
      references,
    },
  }

  // Remove the reference to the bibliography file as it has been inlined to the `references` key by this point
  delete context.frontmatter.bibliography

  return isStandalone
    ? decodeArticle(root, context)
    : root.children.map((child) => decodeNode(child, context))
}

function loadFrontmatter(root: MDAST.Root): Frontmatter {
  const [frontmatterYaml] = root.children.filter(
    (child) => child.type === 'yaml'
  )
  const frontmatter = yaml.safeLoad(
    typeof frontmatterYaml?.value === 'string' ? frontmatterYaml.value : ''
  )
  return typeof frontmatter === 'object' ? (frontmatter as Frontmatter) : {}
}

/**
 * Encode a Stencila `Node` to a Markdown `string`.
 */
export function encodeMarkdown(node: stencila.Node): string {
  const encoded = encodeNode(node).flat()
  if (encoded.length === 0) return ''

  let mdast = filter(
    encoded[0],
    // @ts-ignore
    (node: UNIST.Node | undefined) => typeof node !== 'undefined'
  ) as UNIST.Node
  mdast = stringifyExtensions(mdast)
  mdast = stringifyAttrs(mdast)

  return unified()
    .use(stringifier)
    .use(frontmatter, FRONTMATTER_OPTIONS)
    .stringify(mdast)
}

/**
 * Given a file path to a bibliography file in a BibTeX format,
 * attempt to read it into an array of `CreativeWork`s.
 */
async function inlineReferences(
  docFilePath: string,
  bibFilePath: string
): Promise<stencila.Article['references']> {
  const resolvedPath = path.join(path.dirname(docFilePath), bibFilePath)
  if (fs.existsSync(resolvedPath)) {
    const refs = await bibCodec.read(resolvedPath)
    if (Array.isArray(refs)) {
      return refs.filter(isCreativeWork)
    } else {
      log.warn(`Error parsing bibliography file: ${resolvedPath}`)
    }
  } else {
    log.warn(`Bibliography file could not be found: ${resolvedPath}`)
  }
  return undefined
}

/**
 * Given an `Article` node, will check if it contains a large number of references,
 * and if so extracts the references into an external BibTeX file.
 */
async function extractReferences(
  article: stencila.Article,
  options: CommonEncodeOptions
): Promise<stencila.Article> {
  // Article doesn't contain references, so terminate early
  if (!article.references || article.references.length === 0) return article

  // If article only contains a handful of references, keep them in the MD file
  const referenceExtractionThreshold = 5
  if (article.references.length <= referenceExtractionThreshold) return article

  // If the encoding target is being written to disk, extract references to a
  // separate file, refer to it in meta, and remove inlined references
  if (options.filePath && options.filePath !== STDIO_PATH) {
    const { dir, name } = path.parse(options.filePath)
    const bibPath = path.format({ dir, name, ext: '.references.bib' })
    await bibCodec.write(article.references, bibPath)

    return stencila.article({
      ...article,
      references: undefined,
      meta: {
        bibliography: path.relative(dir, bibPath),
      },
    })
  }

  return article
}

/**
 * Do any async operations necessary on the node tree before encoding it.
 *
 * This avoids having to "taint" the whole decode function call stack with
 * async calls.
 */
async function encodePrepare(
  rootNode: stencila.Node,
  options: CommonEncodeOptions
): Promise<stencila.Node> {
  return transform(
    rootNode,
    async (node) => {
      if (stencila.isArticle(node)) {
        return await extractReferences(node, options)
      }
      if (
        stencila.isA('MathFragment', node) ||
        stencila.isA('MathBlock', node)
      ) {
        if (node.mathLanguage !== 'tex') {
          const text = await texCodec.dump(node)
          return {
            ...node,
            mathLanguage: 'tex',
            text,
          }
        }
      }
      return node
    },
    true
  )
}

function decodeNode(node: UNIST.Node, context: DecodeContext): stencila.Node {
  const type = node.type
  switch (type) {
    case 'heading':
      return decodeHeading(node as MDAST.Heading, context)
    case 'paragraph':
      return decodeParagraph(node as MDAST.Paragraph, context)
    case 'blockquote':
      return decodeBlockquote(node as MDAST.Blockquote, context)
    case 'math':
      return decodeMath(node as MDAST.Literal)
    case 'code':
      return decodeCodeblock(node as MDAST.Code)
    case 'list':
      return decodeList(node as MDAST.List, context)
    case 'listItem':
      return decodeListItem(node as MDAST.ListItem, context)
    case 'table':
      return decodeTable(node as MDAST.Table, context)
    case 'thematicBreak':
      return decodeThematicBreak()

    case 'link':
      return decodeLink(node as MDAST.Link, context)
    case 'emphasis':
      return decodeEmphasis(node as MDAST.Emphasis, context)
    case 'strong':
      return decodeStrong(node as MDAST.Strong, context)
    case 'delete':
      return decodeDelete(node as MDAST.Delete, context)
    case 'cite':
      return decodeCite(node as MDAST.Literal, context)
    case 'sub':
      return decodeSubscript(node as MDAST.Parent, context)
    case 'sup':
      return decodeSuperscript(node as MDAST.Parent, context)
    case 'inlineMath':
      return decodeMath(node as MDAST.Literal)
    case 'inlineCode':
      return decodeInlineCode(node as MDAST.InlineCode)
    case 'image':
      return decodeImage(node as MDAST.Image)
    case 'text':
      return decodeText(node as MDAST.Text)
    case 'inline-extension':
    case 'block-extension': {
      const ext = (node as unknown) as Extension
      switch (ext.name) {
        case 'chunk':
          return decodeCodeChunk(ext)
        case 'figure':
          return decodeFigure(ext)
        case 'table':
          return decodeTableBlock(ext)
        case 'quote':
          return decodeQuote(ext)
        case 'include':
          return decodeInclude(ext)

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
            log.warn(`Unhandled generic extension "${ext.name}"`)
          } else {
            log.warn(`Unregistered generic extension "${node.data?.hName}"`)
          }
          return ''
      }
    }
    case 'html':
      return decodeHTML(node as MDAST.HTML)

    default:
      log.warn(`No Markdown decoder for MDAST node type "${type}"`)
      return ''
  }
}

function encodeNode(node: stencila.Node): UNIST.Node[] {
  const type_ = nodeType(node)
  switch (type_) {
    case 'Article':
      return [encodeArticle(node as stencila.Article)]

    case 'Include':
      return [encodeInclude(node as stencila.Include)]

    case 'Heading':
      return [encodeHeading(node as stencila.Heading)]
    case 'Paragraph':
      return encodeParagraph(node as stencila.Paragraph)
    case 'QuoteBlock':
      return [encodeQuoteBlock(node as stencila.QuoteBlock)]
    case 'MathBlock':
      return [encodeMath(node as stencila.MathBlock)]
    case 'CodeBlock':
      return [encodeCodeBlock(node as stencila.CodeBlock)]
    case 'CodeChunk':
      return [encodeCodeChunk(node as stencila.CodeChunk)]
    case 'List':
      return [encodeList(node as stencila.List)]
    case 'ListItem':
      return [encodeListItem(node as stencila.ListItem)]
    case 'Table':
      return [encodeTable(node as stencila.Table)]
    case 'Figure':
      return [encodeFigure(node as stencila.Figure)]
    case 'ThematicBreak':
      return [encodeThematicBreak()]

    case 'Cite':
      return [encodeCite(node as stencila.Cite)]
    case 'Link':
      return [encodeLink(node as stencila.Link)]
    case 'Emphasis':
      return [encodeEmphasis(node as stencila.Emphasis)]
    case 'Strong':
      return [encodeStrong(node as stencila.Strong)]
    case 'Delete':
      return [encodeDelete(node as stencila.Delete)]
    case 'Subscript':
      return [encodeSubscript(node as stencila.Subscript)]
    case 'Superscript':
      return [encodeSuperscript(node as stencila.Superscript)]

    case 'Quote':
      return [encodeQuote(node as stencila.Quote)]
    case 'MathFragment':
      return [encodeMath(node as stencila.MathFragment)]
    case 'CodeFragment':
      return [encodeCodeFragment(node as stencila.CodeFragment)]
    case 'CodeExpression':
      return [encodeCodeExpression(node as stencila.CodeExpression)]
    case 'ImageObject':
      return [encodeImageObject(node as stencila.ImageObject)]

    case 'Collection':
      return encodeCollection(node as stencila.Collection)

    case 'Text':
      return [encodeString(node as string)]
    case 'Null':
      return [encodeNull()]
    case 'Boolean':
      return [encodeBoolean(node as boolean)]
    case 'Number':
      return [encodeNumber(node as number)]
    case 'Array':
      if (Array.isArray(node) && isContentArray(node))
        return node.map(encodeNode).flat()
      else return [encodeArray(node as unknown[])]
    case 'Object':
      return [encodeObject(node as Record<string | number, unknown>)]

    default:
      log.warn(`No Markdown encoder for Stencila node type "${type_}"`)
      return [encodeString('')]
  }
}

function encodeContent(node: stencila.Node): MDAST.Content[] {
  return encodeNode(node) as MDAST.Content[]
}

function decodePhrasingContent(
  node: MDAST.PhrasingContent,
  context: DecodeContext
): stencila.InlineContent {
  return decodeNode(node, context) as stencila.InlineContent
}

function encodeInlineContent(
  node: stencila.InlineContent
): MDAST.PhrasingContent[] {
  return encodeNode(node) as MDAST.PhrasingContent[]
}

function decodeBlockContent(
  node: MDAST.BlockContent,
  context: DecodeContext
): stencila.BlockContent {
  return decodeNode(node, context) as stencila.BlockContent
}

function encodeBlockContent(node: stencila.BlockContent): MDAST.BlockContent[] {
  return encodeNode(node) as MDAST.BlockContent[]
}

/**
 * Decode a `MDAST.root` node to a `stencila.Article`
 *
 * If the root has a front matter node (defined using YAML), that
 * meta data is added to the top level of the document. Other
 * child nodes are added to the article's `content` property.
 *
 * If the first content node if a level 1 heading, use
 * it as the `title`.
 *
 * @param root The MDAST root to decode
 */
function decodeArticle(
  root: MDAST.Root,
  context: DecodeContext
): stencila.Article {
  let title = context.frontmatter.title
  const content: stencila.Node[] = []
  for (const child of root.children) {
    if (child.type === 'yaml') {
      // The YAML frontmatter has already been parsed into a JS Object in the `decodeMarkdown` function
    } else if (
      title === undefined &&
      child.type === 'heading' &&
      child.depth === 1
    ) {
      const content = ensureInlineContentArray(
        child.children.map((child) => decodeNode(child, context))
      )
      title =
        content.length === 1 && typeof content[0] === 'string'
          ? content[0]
          : content
    } else {
      content.push(decodeNode(child, context))
    }
  }

  return stencila.article({
    ...context.frontmatter,
    title,
    references: context.frontmatter.references,
    content,
  })
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
    children: [],
  }

  // Encode the article content
  if (article.content) {
    root.children = article.content.map(encodeContent).flat()
  }

  // If the Article references have been extracted into a separate bibliography file,
  // move the file path from the `meta` object to the YAML frontmatter.
  // Note that this is a Markdown format specific approach, and needs to be handled
  // when decoding the frontmatter.
  const bibliography = article.meta?.bibliography
  if (bibliography && typeof bibliography === 'string') {
    if (article.meta) {
      delete article.meta.bibliography
      if (Object.keys(article.meta).length === 0) delete article.meta
    }
  }

  // Article properties other than `content` go into YAML frontmatter
  // including any bibliography
  const frontmatter: Frontmatter = {}
  for (const [key, value] of Object.entries(article)) {
    if (!['type', 'content'].includes(key)) {
      frontmatter[key] = value
    }
  }
  if (bibliography) frontmatter.bibliography = bibliography
  if (Object.keys(frontmatter).length) {
    const yamlNode: MDAST.YAML = {
      type: 'yaml',
      value: yaml.safeDump(frontmatter, { skipInvalid: true }).trim(),
    }
    root.children.unshift(yamlNode)
  }

  return root
}

/**
 * Decode a `include:` block extension to a `stencila.Include`
 */
function decodeInclude(ext: Extension): stencila.Include {
  const include: stencila.Include = {
    type: 'Include',
    source: ext.argument ?? '',
  }
  if (ext.content) {
    const article = decodeMarkdown(ext.content)
    include.content = (article.content ?? []).filter(isBlockContent)
  }
  return include
}

/**
 * Encode a `stencila.Include` to a `include:` block extension
 */
function encodeInclude(include: stencila.Include): Extension {
  const { source, content = [] } = include
  const md = encodeMarkdown({ type: 'Article', content }).trim()
  return {
    type: 'block-extension',
    name: 'include',
    argument: source,
    content: md,
  }
}

/**
 * Decode a `MDAST.Heading` to a `stencila.Heading`
 */
function decodeHeading(
  heading: MDAST.Heading,
  context: DecodeContext
): stencila.Heading {
  return {
    type: 'Heading',
    depth: heading.depth,
    content: heading.children.map((child) =>
      decodePhrasingContent(child, context)
    ),
  }
}

/**
 * Encode a `stencila.Heading` to a `MDAST.Heading`
 */
function encodeHeading(heading: stencila.Heading): MDAST.Heading {
  return {
    type: 'heading',
    depth: heading.depth as 1 | 2 | 3 | 4 | 5 | 6,
    children: heading.content.map(encodeInlineContent).flat(),
  }
}

/**
 * Decode a `MDAST.Paragraph` to a `stencila.Paragraph`
 */
function decodeParagraph(
  paragraph: MDAST.Paragraph,
  context: DecodeContext
): stencila.Paragraph {
  return {
    type: 'Paragraph',
    content: paragraph.children.map((child) =>
      decodePhrasingContent(child, context)
    ),
  }
}

/**
 * Encode a `stencila.Paragraph` to a `MDAST.Paragraph`
 *
 * Returns `undefined` (i.e skip this node) if the paragraph
 * is empty (not content, or only whitespace)
 */
function encodeParagraph(paragraph: stencila.Paragraph): MDAST.Paragraph[] {
  const content = paragraph.content
  if (
    content.length === 0 ||
    (content.length === 1 &&
      nodeType(content[0]) === 'Text' &&
      (content[0] as string).trim().length === 0)
  ) {
    return []
  } else {
    return [
      {
        type: 'paragraph',
        children: content.map(encodeInlineContent).flat(),
      },
    ]
  }
}

/**
 * Decode a `MDAST.Blockquote` to a `stencila.QuoteBlock`
 */
function decodeBlockquote(
  block: MDAST.Blockquote,
  context: DecodeContext
): stencila.QuoteBlock {
  return {
    type: 'QuoteBlock',
    content: block.children.map((child) => decodeBlockContent(child, context)),
  }
}

/**
 * Encode a `stencila.QuoteBlock` to a `MDAST.Blockquote`
 */
function encodeQuoteBlock(block: stencila.QuoteBlock): MDAST.Blockquote {
  return {
    type: 'blockquote',
    children: block.content.map(encodeBlockContent).flat(),
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
 * ```python meta1 meta2=foo meta3="bar baz"
 * ~~~
 *
 * is decoded to a `CodeBlock` with `language` `"python"` and `meta`
 * `{meta1:"", meta2:"foo", meta3:"bar baz" }`
 */
function decodeCodeblock(code: MDAST.Code): stencila.CodeBlock {
  const codeBlock: stencila.CodeBlock = {
    type: 'CodeBlock',
    text: code.value,
  }
  if (code.lang) codeBlock.programmingLanguage = code.lang
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
 * Encode a `stencila.CodeBlock` to a `MDAST.Code` node.
 */
function encodeCodeBlock(block: stencila.CodeBlock): MDAST.Code {
  const { text, programmingLanguage, meta } = block
  return {
    type: 'code',
    lang: programmingLanguage,
    meta: meta !== undefined ? stringifyMeta(meta) : '',
    value: text.trimRight(),
  }
}

/**
 * Decode a `chunk:` block extension to a `stencila.CodeChunk`
 */
function decodeCodeChunk(ext: Extension): stencila.CodeChunk {
  const { content = '', argument, properties } = ext

  const article = decodeMarkdown(content)
  const nodes = (article.content && article.content) || []

  const caption: stencila.Node[] = []
  let code
  let index = 0
  for (const node of nodes) {
    index += 1
    if (stencila.isA('CodeBlock', node)) {
      code = node
      break
    } else {
      caption.push(node)
    }
  }

  if (code === undefined) code = stencila.codeBlock({ text: '' })
  const { text, programmingLanguage } = code

  const outputs: stencila.Node[] = []
  if (nodes.length > index) {
    const pushOutputs = function (outputNodes: stencila.Node[]) {
      if (outputNodes.length === 1) {
        const node = outputNodes[0]
        if (stencila.isA('Paragraph', node) && node.content.length === 1) {
          // Unwrap the paragraph (e.g. into a `string`, or `number`)
          outputs.push(node.content[0])
        } else {
          // Singular node
          outputs.push(node)
        }
      }
      // An array of nodes
      // In the future these may wrapped into a container node to avoid having
      // a `BlockContent[]` as an output
      else outputs.push(outputNodes)
    }

    let outputNodes: stencila.Node[] = []
    for (const outputContainer of nodes.slice(index)) {
      // When a thematic break is encountered, start a new
      // output
      if (stencila.isA('ThematicBreak', outputContainer)) {
        pushOutputs(outputNodes)
        outputNodes = []
        continue
      }
      outputNodes.push(outputContainer)
    }
    pushOutputs(outputNodes)
  }

  const { id, className, ...meta } = properties ?? {}

  return stencila.codeChunk({
    text,
    programmingLanguage,
    meta: Object.keys(meta).length > 0 ? meta : undefined,
    outputs: outputs.length > 0 ? outputs : undefined,
    caption: caption.length > 0 ? caption : undefined,
    label: argument,
    id,
  })
}

/**
 * Encode a `stencila.CodeChunk` to a `chunk:` block extension
 */
function encodeCodeChunk(chunk: stencila.CodeChunk): Extension {
  const {
    programmingLanguage = 'text',
    meta,
    text,
    outputs,
    id,
    label,
    caption = [],
  } = chunk
  const nodes: stencila.Node[] = []

  // Encode the caption (if any)
  nodes.push(...caption)

  // Encode the code as a `CodeBlock`
  nodes.push(
    stencila.codeBlock({
      text,
      programmingLanguage,
      meta,
    })
  )

  // Separate each item in `outputs` with a `ThematicBreak`
  if (outputs !== undefined) {
    let index = 0
    for (const output of outputs) {
      if (index !== 0) nodes.push({ type: 'ThematicBreak' })
      // If the array only has block content then add those separately instead as an array
      // This may be obviated if we use a container node instead for block content
      if (
        Array.isArray(output) &&
        output.filter(stencila.isBlockContent).length === output.length
      ) {
        nodes.push(...output)
      } else nodes.push(output)
      index += 1
    }
  }

  // Encode nodes as Markdown
  const md = encodeMarkdown({ type: 'Article', content: nodes }).trim()

  return {
    type: 'block-extension',
    name: 'chunk',
    content: md,
    argument: label,
    properties: id ? { id } : undefined,
  }
}

/**
 * Decode a `figure:` block extension to a `stencila.Figure`.
 *
 * The first node of the extension is the `content` property
 * of the `Figure`. Subsequent nodes are the `caption` property.
 * The extension's `argument` becomes the figure's `label`.
 */
function decodeFigure(ext: Extension): stencila.Figure {
  const { content = '', argument, properties } = ext

  const nodes = decodeMarkdown(content).content ?? []

  const caption: stencila.Node[] = []
  let image: stencila.ImageObject | undefined
  for (const node of nodes) {
    // The first node that is a paragraph with only an image in
    // it is unwrapped and made the figure's image.
    if (
      image === undefined &&
      stencila.isParagraph(node) &&
      node.content?.length === 1 &&
      stencila.isA('ImageObject', node.content[0])
    ) {
      image = node.content[0]
    } else {
      caption.push(node)
    }
  }

  return stencila.figure({
    content: image ? [image] : [],
    caption,
    label: argument,
    id: properties?.id,
  })
}

/**
 * Encode a `stencila.Figure` to a `figure:` block extension
 *
 * The `content` of the figure, usually an `ImageObject`, is the
 * first node of the extension's content. The `caption` is the remainder.
 *
 * In the future, if there is more than one content node, then we
 * may use a `ThematicBreak` to separate content from caption.
 */
function encodeFigure(figure: stencila.Figure): Extension {
  const { content, caption, label, id } = figure

  const nodes = [...(content ?? []), ...(caption ?? [])]
  const md = encodeMarkdown({ type: 'Article', content: nodes }).trim()

  return {
    type: 'block-extension',
    name: 'figure',
    content: md,
    argument: label,
    properties: id ? { id } : undefined,
  }
}

/**
 * Decode a `MDAST.List` to a `stencila.List`
 */
function decodeList(list: MDAST.List, context: DecodeContext): stencila.List {
  return {
    type: 'List',
    order: list.ordered ? 'ascending' : 'unordered',
    items: list.children
      .map((child) => decodeNode(child, context))
      .filter(isListItem),
  }
}

/**
 * Encode a `stencila.List` to a `MDAST.List`
 */
function encodeList(list: stencila.List): MDAST.List {
  return {
    type: 'list',
    ordered: list.order === 'ascending',
    children: list.items.filter(isListItem).map(encodeListItem),
  }
}

/**
 * Encode a `MDAST.ListItem` to a `stencila.ListItem`
 */
function encodeListItem(listItem: stencila.ListItem): MDAST.ListItem {
  const { isChecked, content = [] } = listItem
  const _listItem: MDAST.ListItem = {
    type: 'listItem',
    children: content.map((child) => {
      const mdast = encodeNode(child)[0]
      if (isMdastBlockContent(mdast)) return mdast
      if (isMdastPhrasingContent(mdast))
        return { type: 'paragraph', children: [mdast] }
      log.warn(`Unhandled list item MDAST type ${mdast?.type}`)
      return { type: 'paragraph', children: [] }
    }),
  }
  return isChecked !== undefined
    ? { ..._listItem, checked: isChecked }
    : _listItem
}

/**
 * Decode a `MDAST.List` to a `stencila.List`
 */
function decodeListItem(
  listItem: MDAST.ListItem,
  context: DecodeContext
): stencila.ListItem {
  const _listItem: stencila.ListItem = {
    type: 'ListItem',
    content: listItem.children
      .map((child) => decodeNode(child, context))
      .filter(isBlockContent),
  }
  return listItem.checked === true || listItem.checked === false
    ? { ..._listItem, isChecked: listItem.checked || false }
    : _listItem
}

/**
 * Decode a `MDAST.Table` to a `stencila.Table`
 */
function decodeTable(
  table: MDAST.Table,
  context: DecodeContext
): stencila.Table {
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
                content: cell.children.map((child) =>
                  decodePhrasingContent(child, context)
                ),
              }
            }
          ),
        }
      }
    ),
  }
}

/**
 * Decode a `table` block extension to a `stencila.Table`.
 */
function decodeTableBlock(ext: Extension): stencila.Table {
  const { content = '', argument, properties } = ext

  const nodes = decodeMarkdown(content).content ?? []

  const caption: stencila.Node[] = []
  let table
  for (const node of nodes) {
    if (table === undefined && isA('Table', node)) {
      table = node
    } else {
      caption.push(node)
    }
  }

  if (table === undefined) table = stencila.table({ rows: [] })

  return stencila.table({
    ...table,
    id: properties?.id,
    label: argument,
    caption,
  })
}

/**
 * Encode a `stencila.Table` to a `MDAST.Table`
 */
function encodeTable(table: stencila.Table): MDAST.Table | Extension {
  const { id, label, caption, ...restTable } = table

  if (id || caption || label) {
    let content = ''
    if (typeof caption === 'string') {
      content += caption + '\n\n'
    } else if (Array.isArray(caption) && caption.length > 0) {
      content += caption.map(encodeMarkdown).join('\n\n') + '\n\n'
    }
    content += encodeMarkdown(restTable)

    return {
      type: 'block-extension',
      name: 'table',
      argument: label,
      content,
      properties: id ? { id } : undefined,
    }
  }

  return {
    type: 'table',
    children: table.rows.map(
      (row: stencila.TableRow): MDAST.TableRow => {
        return {
          type: 'tableRow',
          children: row.cells.map(
            (cell: stencila.TableCell): MDAST.TableCell => {
              const content = ensureInlineContentArray(cell.content)
              // If there is only one node in the table cell and it is
              // a primitive e.g. a number, or boolean then encode it
              // as a string rather than as the special `!number` etc inline
              // extensions (which are aimed at distinguishing primitives in
              // amongst other inline content)
              const children =
                content.length === 1 &&
                stencila.isPrimitive(content[0]) &&
                content[0] !== null
                  ? [encodeString(`${content[0]}`)]
                  : content.map(encodeInlineContent).flat()
              return {
                type: 'tableCell',
                children,
              }
            }
          ),
        }
      }
    ),
  }
}

/**
 * Decode a `MDAST.ThematicBreak` to a `stencila.ThematicBreak`
 */
function decodeThematicBreak(): stencila.ThematicBreak {
  return {
    type: 'ThematicBreak',
  }
}

/**
 * Encode a `stencila.ThematicBreak` to a `MDAST.ThematicBreak`
 */
function encodeThematicBreak(): MDAST.ThematicBreak {
  return {
    type: 'thematicBreak',
  }
}

/**
 * Decode a `MDAST.Link` to a `stencila.Link`
 */
function decodeLink(link: MDAST.Link, context: DecodeContext): stencila.Link {
  const link_: stencila.Link = {
    type: 'Link',
    target: link.url,
    content: link.children.map((child) =>
      decodePhrasingContent(child, context)
    ),
  }
  // The `remark-attrs` plugin decodes curly brace attributes to `data.hProperties`
  const meta = link.data?.hProperties as {
    [key: string]: string
  }
  if (meta) link_.meta = meta
  if (link.title) link_.title = link.title
  return link_
}

/**
 * Encode a Stencila `Cite` node to a MDAST `Text` node
 * with Pandoc style `@`-prefixed citations e.g. `@smith04`.
 */
function encodeCite(cite: stencila.Cite): MDAST.Text {
  return {
    type: 'text',
    value: `@${cite.target}`,
  }
}

/**
 * Encode a MDAST `Cite` node with Pandoc style `@`-prefixed citations e.g. `@smith04` to a Stencila `Cite` node.
 */
function decodeCite(
  cite: MDAST.Literal,
  context: DecodeContext
): stencila.Cite {
  const ref: string | stencila.CreativeWorkTypes =
    context.frontmatter.references?.find((ref) =>
      typeof ref === 'string' ? false : ref.id === cite.value
    ) ?? cite.value

  let value = cite.value
  // If the reference is a `CreativeWork` node, summarize it into a citation format
  // such as `Smith et al (1990)`
  if (stencila.isCreativeWork(ref)) {
    value = encodeCitationText(ref)
  }

  return stencila.cite({
    target: cite.value,
    content: [value],
  })
}

/**
 * Encode a `stencila.Link` to a `MDAST.Link`
 */
function encodeLink(link: stencila.Link): MDAST.Link {
  const data = { hProperties: link.meta }
  return {
    type: 'link',
    url: link.target,
    title: link.title,
    children: link.content
      .map((node) => encodeInlineContent(node) as MDAST.StaticPhrasingContent[])
      .flat(),
    data,
  }
}

/**
 * Decode a `MDAST.Emphasis` to a `stencila.Emphasis`
 */
function decodeEmphasis(
  emphasis: MDAST.Emphasis,
  context: DecodeContext
): stencila.Emphasis {
  return {
    type: 'Emphasis',
    content: emphasis.children.map((child) =>
      decodePhrasingContent(child, context)
    ),
  }
}

/**
 * Encode a `stencila.Emphasis` to a `MDAST.Emphasis`
 */
function encodeEmphasis(emphasis: stencila.Emphasis): MDAST.Emphasis {
  return {
    type: 'emphasis',
    children: emphasis.content.map(encodeInlineContent).flat(),
  }
}

/**
 * Decode a `MDAST.Strong` to a `stencila.Strong`
 */
function decodeStrong(
  strong: MDAST.Strong,
  context: DecodeContext
): stencila.Strong {
  return {
    type: 'Strong',
    content: strong.children.map((child) =>
      decodePhrasingContent(child, context)
    ),
  }
}

/**
 * Encode a `stencila.Strong` to a `MDAST.Strong`
 */
function encodeStrong(strong: stencila.Strong): MDAST.Strong {
  return {
    type: 'strong',
    children: strong.content.map(encodeInlineContent).flat(),
  }
}

/**
 * Decode a `MDAST.Delete` to a `stencila.Delete`
 */
function decodeDelete(
  delet: MDAST.Delete,
  context: DecodeContext
): stencila.Delete {
  return {
    type: 'Delete',
    content: delet.children.map((child) =>
      decodePhrasingContent(child, context)
    ),
  }
}

/**
 * Encode a `stencila.Delete` to a `MDAST.Delete`
 */
function encodeDelete(delet: stencila.Delete): MDAST.Delete {
  return {
    type: 'delete',
    children: delet.content.map(encodeInlineContent).flat(),
  }
}

/**
 * Decode a MDAST `sub` node to a Stencila `Subscript` node.
 */
const decodeSubscript = (
  sub: MDAST.Parent,
  context: DecodeContext
): stencila.Subscript => {
  return stencila.subscript({
    content: sub.children.map((node) =>
      decodePhrasingContent(node as MDAST.PhrasingContent, context)
    ),
  })
}

/**
 * Encode a Stencila `Subscript` as a MDAST `text` node with surrounding tildes.
 *
 * This assumes that there is only `string`s in the `content` of the subscript.
 */
const encodeSubscript = (sub: stencila.Subscript): MDAST.Text => {
  return {
    type: 'text',
    value: `~${TxtCodec.stringify(sub)}~`,
  }
}

/**
 * Decode a MDAST `sup` node to a Stencila `Superscript` node.
 */
const decodeSuperscript = (
  sup: MDAST.Parent,
  context: DecodeContext
): stencila.Superscript => {
  return stencila.superscript({
    content: sup.children.map((node) =>
      decodePhrasingContent(node as MDAST.PhrasingContent, context)
    ),
  })
}

/**
 * Encode a Stencila `Superscript` as a MDAST `text` node with surrounding carets.
 *
 * This assumes that there is only `string`s in the `content` of the subscript.
 */
const encodeSuperscript = (sup: stencila.Superscript): MDAST.Text => {
  return {
    type: 'text',
    value: `^${TxtCodec.stringify(sup)}^`,
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
    content: ext.content ? [ext.content] : [],
  }
  const cite = ext.argument
  if (cite) quote.cite = cite
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
    argument: quote.cite as string,
  }
}

/**
 * Decode a MDAST `inlineMath` or `math` node to either a Stencila `MathFragment`
 * or `MathBlock`.
 */
function decodeMath(
  math: MDAST.Literal
): stencila.MathFragment | stencila.MathBlock {
  const { type, value } = math
  return (type === 'inlineMath' ? stencila.mathFragment : stencila.mathBlock)({
    mathLanguage: 'tex',
    text: value,
  })
}

/**
 * Encode a `MathFragment` or `MathBlock` to TeX with delimiters.
 *
 * Uses an MDAST `HTML` node to avoid escaping of back slashes etc
 */
function encodeMath(math: stencila.Math): MDAST.HTML {
  const { type, mathLanguage, text } = math
  const [begin, end] = type === 'MathFragment' ? ['$', '$'] : ['$$\n', '\n$$']
  if (mathLanguage !== 'tex')
    log.warn(`Math node contains unhandled math language: ${mathLanguage}`)
  return {
    type: 'html',
    value: `${begin}${text.trim()}${end}`,
  }
}

/**
 * Decode a `MDAST.InlineCode` to either a static `stencila.CodeFragment`
 * or an executable `stencila.CodeExpression`.
 */
function decodeInlineCode(
  inlineCode: MDAST.InlineCode
): stencila.CodeFragment | stencila.CodeExpression {
  const attrs =
    inlineCode.data &&
    (inlineCode.data.hProperties as { [key: string]: string })

  if (attrs && attrs.type === 'expr') {
    const codeExpr = stencila.codeExpression({ text: inlineCode.value })
    const { type, lang, output, ...rest } = attrs
    if (output) codeExpr.output = JSON.parse(output.replace(/"/g, '"'))
    if (lang) codeExpr.programmingLanguage = lang
    if (Object.keys(rest).length) codeExpr.meta = rest
    return codeExpr
  } else {
    const codeFrag = stencila.codeFragment({ text: inlineCode.value })
    if (attrs) {
      const { lang, ...rest } = attrs
      if (lang) codeFrag.programmingLanguage = lang
      if (Object.keys(rest).length) codeFrag.meta = rest
    }
    return codeFrag
  }
}

/**
 * Encode a `stencila.CodeFragment` node to a `MDAST.InlineCode`
 */
function encodeCodeFragment(code: stencila.CodeFragment): MDAST.InlineCode {
  let attrs
  if (code.programmingLanguage) attrs = { lang: code.programmingLanguage }
  if (code.meta) attrs = { ...attrs, ...code.meta }
  return {
    type: 'inlineCode',
    data: { hProperties: attrs },
    value: code.text,
  }
}

/**
 * Encode a `stencila.CodeExpression` to a `MDAST.InlineCode` with
 * `{type=expr}`
 */
function encodeCodeExpression(
  codeExpr: stencila.CodeExpression
): MDAST.InlineCode {
  const attrs: { [key: string]: any } = {
    type: 'expr',
    lang: codeExpr.programmingLanguage,
    ...codeExpr.meta,
  }

  if (codeExpr.output)
    attrs.output = JSON.stringify(codeExpr.output).replace(/"/g, '\\"')

  return {
    type: 'inlineCode',
    data: { hProperties: attrs },
    value: codeExpr.text || '',
  }
}

/**
 * Decode a `MDAST.Image` to a `stencila.ImageObject`
 */
function decodeImage(image: MDAST.Image): stencila.ImageObject {
  const imageObject: stencila.ImageObject = {
    type: 'ImageObject',
    contentUrl: image.url,
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
  const { title, text, meta, contentUrl } = imageObject

  const image: MDAST.Image = {
    type: 'image',
    url: contentUrl || '',
  }
  if (title) image.title = TxtCodec.stringify(title)
  if (text) image.alt = text
  if (meta) {
    // Remove the redundant `inline` attribute if it exits
    const { inline, ...rest } = meta
    if (Object.keys(rest).length > 0) image.data = { hProperties: rest }
  }
  return image
}

/**
 * Encode a Stencila `Collection` to an array of `MDAST`
 *
 * Collection nodes are sometimes used in the content of an article to
 * represent grouped nodes e.g. a figure group. This function simply
 * encodes each of the nodes within ther collection (i.e. it is lossy)
 * since Markdown does not have a good way to represent such grouping / nesting.
 */
function encodeCollection(collection: stencila.Collection): UNIST.Node[] {
  return collection.parts
    .map((part) => encodeBlockContent(part as stencila.BlockContent))
    .flat()
}

/**
 * Decode a `MDAST.Text` to a `string`.
 *
 * Replaces newline and carriage returns with a space.
 * This is done to ensure that paragraphs that are written
 * across multiple lines do not have newlines in them.
 */
function decodeText(text: MDAST.Text): string {
  return text.value.replace(whiteSpaceRegEx, '$1 ')
}

/**
 * Encode a `string` to a `MDAST.Text`
 */
function encodeString(value: string): MDAST.Text {
  return {
    type: 'text',
    value: value.replace(whiteSpaceRegEx, '$1 '),
  }
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
    default: {
      const value = ext.argument ?? ext.content ?? 'true'
      return !!(value === 'true' || value === '1')
    }
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
  return parseFloat(ext.argument ?? ext.content ?? '0')
}

/**
 * Encode a `number` to a `!number` inline extension
 */
function encodeNumber(value: number): Extension {
  return {
    type: 'inline-extension',
    name: 'number',
    argument: value.toString(),
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
  const items = ext.argument ?? ext.content ?? ''
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
function decodeObject(ext: Extension): Record<string, unknown> {
  if (ext.properties) {
    // Extension properties always contain `className` and `id`, which may
    // be undefined, so drop them.
    const props: { [key: string]: any } = {}
    for (const [key, value] of Object.entries(ext.properties)) {
      // tslint:disable-next-line
      if (typeof value !== 'undefined') props[key] = value
    }
    if (Object.keys(props).length > 0) return props
  }
  return JSON5.parse(`{${ext.argument ?? ext.content}}`) // ` to "escape" syntax highlighting
}

/**
 * Encode an `object` to a `!object` inline extension
 */
function encodeObject(value: Record<string | number, unknown>): Extension {
  const argument = JSON5.stringify(value).slice(1, -1)
  return { type: 'inline-extension', name: 'object', argument }
}

/**
 * Decode a generic extension into an MDAST node.
 */
function decodeExtension(
  type: 'inline-extension' | 'block-extension',
  element: Extension
): UNIST.Node {
  return { ...element, type }
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
function stringifyExtensions(tree: UNIST.Node): UNIST.Node {
  // Convert the `properties` object to a string using the logic outlined at
  // https://github.com/medfreeman/remark-generic-extensions#available-properties
  const stringifyProperties = ([key, value]: [string, unknown]): string => {
    if (key === 'id' && typeof value === 'string') {
      return `#${value}`
    } else if (key === 'class' && typeof value === 'string') {
      return value
    } else {
      return `${key}=${
        typeof value === 'string' ? value : JSON.stringify(value)
      }`
    }
  }

  return map(tree, (node: any) => {
    if (node.type === 'inline-extension' || node.type === 'block-extension') {
      const props = Object.entries(node.properties || {})
        .map(stringifyProperties)
        .join(' ')

      let value

      if (node.type === 'inline-extension') {
        value = `!${node.name}`
        if (node.content) value += `[${node.content}]`
        if (node.argument) value += `(${node.argument})`
        if (node.properties) value += `{${props}}`
      } else {
        value = `${node.name}:`
        if (node.argument) value += ` ${node.argument}`
        value += `\n:::\n${node.content || ''}\n:::`
        if (node.properties) value += `\n{${props}}`
      }
      return { type: 'html', value }
    }

    return node
  })
}

const htmlCodec = new HTMLCodec()

/**
 * Decode a `MDAST.HTML` node to a Stencila `Node`
 *
 * This delegates to the `html` codec. If the HTML fragment is
 * not handled there (e.g. HTML with only non-semantic elements like `<div>`s)
 * then decode to an empty string
 */
function decodeHTML(html: MDAST.HTML): stencila.Node {
  const node = htmlCodec.decodeHtml(html.value)
  return node !== undefined ? node : ''
}

/**
 * Encode a node with `data.hProperties` into a `MDAST.HTML` node
 * with attributes in curly braces `{}`.
 *
 * The `remark-attr` plugin does not do this stringifying for us
 * (it only works with `rehype`).
 */
function stringifyAttrs(tree: UNIST.Node): UNIST.Node {
  const types = ['heading', 'code', 'link', 'inlineCode', 'image']
  const codec = unified().use(stringifier)
  const md = (node: UNIST.Node): string => codec.stringify(node)
  return map(tree, (node: UNIST.Node) => {
    if (types.includes(node.type) && node.data && node.data.hProperties) {
      const meta = stringifyMeta(
        node.data.hProperties as {
          [key: string]: string
        }
      )
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
function stringifyMeta(meta: { [key: string]: string }): string {
  return Object.entries(meta)
    .map(([key, value]) => {
      let repr = key
      if (value) {
        repr += '='
        if (/\s/.test(value)) {
          repr += '"' + value + '"'
        } else {
          repr += value
        }
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
  const definitions: { [key: string]: string } = selectAll(
    'definition',
    tree
  ).reduce((prev: { [key: string]: string }, curr: UNIST.Node) => {
    const def = curr as MDAST.Definition
    prev[def.identifier] = def.url
    return prev
  }, {})
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
    // @ts-ignore
    (node: UNIST.Node) => node.type !== 'definition'
  ) as UNIST.Node
}
