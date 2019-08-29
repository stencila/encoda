/**
 * @module pandoc
 */

import { getLogger } from '@stencila/logga'
import stencila from '@stencila/schema'
import {
  isBlockContent,
  isInlineContent,
  nodeType
} from '@stencila/schema/dist/util'
import childProcess from 'child_process'
import { makeBy } from 'fp-ts/lib/Array'
import tempy from 'tempy'
import { write } from '../..'
import { ensureBlockContent } from '../../util/ensureBlockContent'
import * as vfile from '../../util/vfile'
import { RPNGCodec } from '../rpng'
import { Codec, defaultEncodeOptions, GlobalEncodeOptions } from '../types'
import { binary, dataDir } from './binary'
import * as P from './types'

const rpng = new RPNGCodec()

export { InputFormat, OutputFormat } from './types'

const logger = getLogger('encoda:pandoc')

interface DecodeOptions {
  flags?: string[]
  ensureFile?: boolean
  from?: P.InputFormat
}

const defaultDecodeOptions = {
  ensureFile: false,
  from: P.InputFormat.json,
  flags: []
}

interface EncodeOptions {
  flags?: string[]
  ensureFile?: boolean
}

export class PandocCodec extends Codec
  implements Codec<EncodeOptions, DecodeOptions> {
  // Although this codec is usually used as a base for others (e.g `docx`),
  // the following definitions allow Pandoc JSON to be decoded or encoded
  // directly
  public readonly mediaTypes = ['application/pandoc+json']

  public readonly extNames = ['pandoc']

  /**
   * Decode a `VFile` to a `stencila.Node`.
   *
   * @param file The `VFile` to decode
   * @returns A promise that resolves to a `stencila.Node`
   */
  public readonly decode = async (
    file: vfile.VFile,
    options: DecodeOptions = {}
  ): Promise<stencila.Node> => {
    const { from, ensureFile, flags: cliOptions } = {
      ...defaultDecodeOptions,
      ...options
    }

    const args = [`--from=${from}`, `--to=json`].concat(cliOptions)

    const content = file.contents
    if (!content || ensureFile) {
      if (ensureFile && !file.path) throw new Error('Must supply a file')
      args.push(`${file.path}`)
    }

    const json = await run(content, args)
    const pdoc = JSON.parse(json)
    return decodeDocument(pdoc)
  }

  /**
   * Encode a `stencila.Node` to a `VFile`.
   *
   * @param node The `stencila.Node` to encode
   * @param options Additional arguments to pass to Pandoc
   * @param ensureFile Ensure that the output is a real file (ie. not stdout?)
   * @returns A promise that resolves to a `VFile`
   */
  public readonly encode = async (
    node: stencila.Node,
    {
      filePath,
      format = P.OutputFormat.json,
      codecOptions = { flags: [], ensureFile: false }
    }: GlobalEncodeOptions<EncodeOptions> = defaultEncodeOptions
  ): Promise<vfile.VFile> => {
    encodePromises = []
    const { standalone, pdoc } = encodeNode(node)
    await Promise.all(encodePromises)

    const { flags = [], ensureFile = false } = codecOptions

    const args = [
      `--from=json`,
      `--to=${format === 'pandoc' ? P.OutputFormat.json : format}`
    ]
    if (standalone) args.push('--standalone')
    for (const option of flags) {
      if (!(!standalone && option.startsWith('--template'))) args.push(option)
    }

    if ((filePath && filePath !== '-') || ensureFile) {
      let output
      if (!filePath || filePath === '-') {
        // Create a new file path, which is returned as `vfile.path`
        output = nodeType(node).toLowerCase() + '.' + format
        filePath = output
      } else output = filePath
      args.push(`--output=${output}`)
    }

    const json = JSON.stringify(pdoc)
    const content = await run(json, args)

    // If content was outputted, then load that into a vfile,
    // otherwise the vfile simply has path to the file created
    if (content) {
      if (format === 'pandoc') {
        // Prettify Pandoc JSON since if that is the desired output format
        // it is usually for human inspection.
        const pretty = JSON.stringify(JSON.parse(content), null, 2)
        return vfile.load(pretty)
      } else {
        return vfile.load(content)
      }
    } else return vfile.create(undefined, { path: filePath })
  }
}

/**
 * Promises for resources (usually rPNGs) to
 * be generated during encoding.
 *
 * This approach of having a global set of promises
 * is a bit hacky but allows us to keep the nested chain
 * of encoding functions synchronous.
 */
let encodePromises: Promise<any>[] = []

/**
 * Run the Pandoc binary
 */
function run(input: string | Buffer, args: string[]): Promise<string> {
  args.push(`--data-dir=${dataDir}`)
  logger.debug(
    `Pandoc spawn\n  path: ${binary.path()}\n  args:\n    ${args.join(
      '\n    '
    )}`
  )
  return new Promise((resolve, reject) => {
    const child = childProcess.spawn(binary.path(), args)

    let stdout = ''
    let stderr = ''
    child.stdout.on('data', data => {
      stdout += data
    })
    child.stderr.on('data', data => {
      stderr += data
    })
    child.on('close', () => {
      if (stderr) {
        logger.error(
          `Pandoc error!\n  message: ${stderr}  args:\n    ${args.join(
            '\n    '
          )}\n`
        )
        reject(new Error(stderr))
      } else {
        logger.debug(`Pandoc success.`)
        resolve(stdout)
      }
    })
    child.on('error', err => {
      reject(err)
    })

    if (input && input.length) {
      child.stdin.on('error', err => {
        // Ignore errors where Pandoc closes stdin
        // before we finish writing to it.
        // @ts-ignore
        if (err.code === 'EPIPE') {
          logger.debug('Pandoc EPIPE error')
        } else {
          reject(err)
        }
      })

      child.stdin.write(input)
      child.stdin.end()
    }
  })
}

/**
 * Decode a Pandoc `Document` to a Stencila `Article`.
 */
function decodeDocument(pdoc: P.Document): stencila.Article {
  const { title, ...meta } = decodeMeta(pdoc.meta)

  let titre = 'Untitled'
  if (title) {
    const type_ = nodeType(title)
    if (type_ === 'string') {
      titre = title as string
    } else if (type_ === 'Paragraph') {
      const para = title as stencila.Paragraph
      // TODO: Avoid as and/or allow for title to be a Paragraph
      titre = para.content[0] as string
    }
  }

  // TODO: mutate other metadata to conform to schema

  const content = decodeBlocks(pdoc.blocks)
  return {
    type: 'Article',
    title: titre,
    authors: [],
    ...meta,
    content
  }
}

/**
 * Encode a Stencila `Node` node to a Pandoc `Document`.
 *
 * This function is intended to be the inverse of `decodeDocument`
 * (although it is not yet).
 */
function encodeNode(
  node: stencila.Node
): { standalone: boolean; pdoc: P.Document } {
  let standalone = false
  let meta: P.Meta = {}
  let blocks: P.Block[] = []

  const type_ = nodeType(node)
  if (type_ === 'Article') {
    const { type, content, ...rest } = node as stencila.Article
    standalone = true
    meta = encodeMeta(rest)
    // TODO: wrap nodes as necessary and avoid use of `as`
    blocks = encodeBlocks(content as stencila.BlockContent[])
  } else {
    if (isBlockContent(node)) {
      // The node is a block, so just encode it
      blocks = encodeBlocks([node])
    } else if (isInlineContent(node)) {
      // Wrap inline content in a paragraph so it can be encoded
      blocks = [{ t: 'Para', c: encodeInlines([node]) }]
    }
  }

  const pdoc: P.Document = {
    'pandoc-api-version': P.Version,
    meta,
    blocks
  }

  return { standalone, pdoc }
}

/**
 * Decode a Pandoc `Meta` node to an `object`
 */
export function decodeMeta(meta: P.Meta): { [key: string]: stencila.Node } {
  return objectMap(meta, (key, value) => decodeMetaValue(value))
}

/**
 * Encode an `object` of metadata into a Pandoc `Meta` node
 */
export function encodeMeta(obj: { [key: string]: any }): P.Meta {
  return objectMap(obj, (key, value) => encodeMetaValue(value))
}

/**
 * Decode a Pandoc `MetaValue` to a Stencila `Node`
 */
function decodeMetaValue(value: P.MetaValue): stencila.Node {
  switch (value.t) {
    case 'MetaBool':
      return value.c
    case 'MetaString':
      if (value.c === '!!null') return null
      if (value.c.slice(0, 9) === '!!number ') {
        return parseFloat(value.c.slice(9))
      }
      return value.c
    case 'MetaList':
      return value.c.map(decodeMetaValue)
    case 'MetaMap':
      return objectMap(value.c, (key, value) => decodeMetaValue(value))
    case 'MetaInlines':
      return {
        type: 'Paragraph',
        content: decodeInlines(value.c)
      }
    case 'MetaBlocks':
      return {
        // TODO: Currently there is no stencila.Division
        // so using QuoteBlock instead
        type: 'QuoteBlock',
        content: decodeBlocks(value.c)
      }
  }
}

/**
 * Encode a Stencila `Node` to a Pandoc `MetaValue`
 *
 * For `null` and `number`, use a YAML "tags" syntax e.g. `!!null`
 * encoded into a Pandoc `MetaString`.
 */
function encodeMetaValue(node: stencila.Node): P.MetaValue {
  switch (nodeType(node)) {
    case 'null':
    case 'undefined':
      return {
        t: 'MetaString',
        c: '!!null'
      }
    case 'boolean':
      return {
        t: 'MetaBool',
        c: node as boolean
      }
    case 'number':
      return {
        t: 'MetaString',
        c: `!!number ${node}`
      }
    case 'string':
      return {
        t: 'MetaString',
        c: node as string
      }
    case 'array':
      return {
        t: 'MetaList',
        c: (node as any[]).map(encodeMetaValue)
      }
    case 'Paragraph':
      return {
        t: 'MetaInlines',
        c: encodeInlines((node as stencila.Paragraph).content)
      }
    case 'QuoteBlock':
      return {
        t: 'MetaBlocks',
        c: encodeBlocks((node as stencila.QuoteBlock).content)
      }
    // For both plain objects, and object with `type`, create a `MetaMap`
    case 'object':
    default:
      return {
        t: 'MetaMap',
        c: objectMap(node as object, (key, value) => encodeMetaValue(value))
      }
  }
}

/**
 * Decode an array of Pandoc `Block` elements.
 */
function decodeBlocks(blocks: P.Block[]): stencila.BlockContent[] {
  return blocks.map(block => decodeBlock(block))
}

/**
 * Encode an array of Stencila `BlockContent` nodes.
 */
function encodeBlocks(nodes: stencila.BlockContent[]): P.Block[] {
  return nodes.map(node => encodeBlock(node))
}

/**
 * Decode a Pandoc `Block` element to a Stencila `BlockContent` node.
 */
function decodeBlock(block: P.Block): stencila.BlockContent {
  switch (block.t) {
    case 'Header':
      return decodeHeader(block)
    case 'Para':
      return decodePara(block)
    case 'BlockQuote':
      return decodeBlockQuote(block)
    case 'CodeBlock':
      return decodeCodeBlock(block)
    case 'BulletList':
    case 'OrderedList':
      return decodeList(block as P.OrderedList)
    case 'Table':
      return decodeTable(block)
    case 'HorizontalRule':
      return decodeHorizontalRule()
  }
  throw new Error(`Unhandled Pandoc node type "${block.t}"`)
}

/**
 * Encode a Stencila `BlockContent` node to a Pandoc `Block` element.
 */
function encodeBlock(block: stencila.BlockContent): P.Block {
  switch (block.type) {
    case 'Heading':
      return encodeHeading(block)
    case 'Paragraph':
      return encodeParagraph(block)
    case 'QuoteBlock':
      return encodeQuoteBlock(block)
    case 'CodeBlock':
      return encodeCodeBlock(block)
    case 'List':
      return encodeList(block)
    case 'Table':
      return encodeTable(block)
    case 'ThematicBreak':
      return encodeThematicBreak()
  }
  return encodeFallbackBlock(block)
}

/**
 * Decode a Pandoc `Header` to a Stencila `Heading`
 *
 * Note: currently, any header attributes are ignored
 */
function decodeHeader(node: P.Header): stencila.Heading {
  return {
    type: 'Heading',
    depth: node.c[0],
    content: decodeInlines(node.c[2])
  }
}

function encodeHeading(node: stencila.Heading): P.Header {
  return {
    t: 'Header',
    c: [node.depth, emptyAttrs, encodeInlines(node.content)]
  }
}

/**
 * Decode a Pandoc `Para` to a Stencila `Paragraph` or
 * other `BlockContent` node.
 *
 * Because a paragraph is used to wrap rPNGs (to ensure a block element
 * at where required) this function checks for `CodeChunk`s and other
 * such encoded elements in a paragraph and returns them if they are the
 * only child node.
 */
function decodePara(node: P.Para): stencila.BlockContent {
  const content = decodeInlines(node.c)
  if (content.length === 1) {
    const node = content[0]
    // TODO: fix this dangerous type casting
    if (nodeType(node) === 'CodeChunk') {
      return (node as unknown) as stencila.CodeChunk
    }
  }
  return {
    type: 'Paragraph',
    content
  }
}

function encodeParagraph(node: stencila.Paragraph): P.Para {
  return {
    t: 'Para',
    c: encodeInlines(node.content)
  }
}

/**
 * Decode a Pandoc `BlockQuote` to a Stencila `QuoteBlock`.
 */
function decodeBlockQuote(node: P.BlockQuote): stencila.QuoteBlock {
  return {
    type: 'QuoteBlock',
    content: decodeBlocks(node.c)
  }
}

/**
 * Encode a Stencila `QuoteBlock` to a Pandoc `BlockQuote`.
 */
function encodeQuoteBlock(node: stencila.QuoteBlock): P.BlockQuote {
  return {
    t: 'BlockQuote',
    c: encodeBlocks(node.content)
  }
}

/**
 * Decode a Pandoc `CodeBlock` to a Stencila `CodeBlock`.
 */
function decodeCodeBlock(node: P.CodeBlock): stencila.CodeBlock {
  const codeblock: stencila.CodeBlock = {
    type: 'CodeBlock',
    value: node.c[1]
  }
  const attrs = decodeAttrs(node.c[0])
  if (attrs) {
    const language = attrs.classes ? attrs.classes.split(' ')[0] : null
    if (language) codeblock.programmingLanguage = language
  }
  return codeblock
}

/**
 * Encode a Stencila `CodeBlock` to a Pandoc `CodeBlock`.
 */
function encodeCodeBlock(node: stencila.CodeBlock): P.CodeBlock {
  const attrs = encodeAttrs({ classes: node.programmingLanguage || '' })
  return {
    t: 'CodeBlock',
    c: [attrs, node.value]
  }
}

/**
 * Decode a Pandoc `BulletList` or `OrderedList` to a Stencila `List`.
 */
function decodeList(node: P.BulletList | P.OrderedList): stencila.List {
  const order = node.t === 'BulletList' ? 'unordered' : 'ascending'
  const blocks: P.Block[][] = node.t === 'BulletList' ? node.c : node.c[1]
  return {
    type: 'List',
    order,
    items: blocks.map(block => ({
      type: 'ListItem',
      content: decodeBlocks(block)
    }))
  }
}

/**
 * Encode Stencila `List` as a Pandoc `BulletList` or `OrderedList`.
 */
function encodeList(node: stencila.List): P.BulletList | P.OrderedList {
  const listAttrs: P.ListAttributes = [
    1,
    { t: P.ListNumberStyle.DefaultStyle },
    { t: P.ListNumberDelim.DefaultDelim }
  ]
  const blocks: P.Block[][] = node.items.map(listItem => {
    return listItem.content.map(ensureBlockContent).map(encodeBlock)
  })
  if (node.order === 'ascending') {
    return { t: 'OrderedList', c: [listAttrs, blocks] }
  } else {
    return { t: 'BulletList', c: blocks }
  }
}

/**
 * Decode a Pandoc `Table` to a Stencila `Table`
 *
 * Note: table caption and column widths and alignments
 * are currently ignored.
 */
function decodeTable(node: P.Table): stencila.Table {
  // const caption = decodeInlines(node.c[0])
  // const aligns = node.c[1]
  // const widths = node.c[2]
  const head = node.c[3].map(decodeBlocks)
  const data = node.c[4].map(row => row.map(decodeBlocks))
  const rows = [head, ...data].map(
    (row: stencila.BlockContent[][]): stencila.TableRow => {
      return {
        type: 'TableRow',
        cells: row.map(
          (cell: stencila.BlockContent[]): stencila.TableCell => {
            return {
              type: 'TableCell',
              // TODO: currently assuming that only one block in each table cell
              // with `content` property
              content: (cell[0] as stencila.Paragraph).content
            }
          }
        )
      }
    }
  )
  return {
    type: 'Table',
    rows
  }
}

/**
 * Encode Stencila `Table` to a Pandoc `Table`.
 */
function encodeTable(node: stencila.Table): P.Table {
  const columnCount = node.rows[0].cells.length

  const caption: P.Inline[] = []
  const aligns: { t: P.Alignment }[] = makeBy(columnCount, () => ({
    t: P.Alignment.AlignDefault
  }))

  const widths: number[] = makeBy(columnCount, () => 0)

  let head: P.TableCell[] = []

  if (node.rows.length > 0) {
    head = node.rows[0].cells.map(cell => {
      // TODO: currently need to wrap stencila.InlineContent[] to P.Block[][]; this will change
      return [
        encodeParagraph({
          type: 'Paragraph',
          content: cell.content
        })
      ]
    })
  }
  let rows: P.TableCell[][] = []
  if (node.rows.length > 1) {
    rows = node.rows.slice(1).map((row: stencila.TableRow) => {
      return row.cells.map((cell: stencila.TableCell) => {
        // TODO: ditto todo item above
        return [
          encodeParagraph({
            type: 'Paragraph',
            content: cell.content
          })
        ]
      })
    })
  }
  return {
    t: 'Table',
    c: [caption, aligns, widths, head, rows]
  }
}

/**
 * Decode a Pandoc `HorizontalRule` to a Stencila `ThematicBreak`
 */
function decodeHorizontalRule(): stencila.ThematicBreak {
  return {
    type: 'ThematicBreak'
  }
}

/**
 * Encode a Stencila `ThematicBreak` to a Pandoc `HorizontalRule`
 */
function encodeThematicBreak(): P.HorizontalRule {
  return {
    t: 'HorizontalRule',
    c: undefined
  }
}

/**
 * Decode an array of Pandoc `Inline` nodes to Stencila `InlineContent` nodes.
 *
 * Merges contiguous `Str` and `Space` elements prior to decoding.
 */
function decodeInlines(nodes: P.Inline[]): stencila.InlineContent[] {
  const inlines = []
  let previous: P.Inline | undefined
  for (const node of nodes) {
    if (
      previous &&
      previous.t === 'Str' &&
      (node.t === 'Space' || node.t === 'Str')
    ) {
      if (node.t === 'Space') previous.c += ' '
      else if (node.t === 'Str') previous.c += node.c
    } else {
      let current = node
      if (node.t === 'Space') {
        current = { t: 'Str', c: ' ' }
      }
      inlines.push(current)
      previous = current
    }
  }
  return inlines.map(decodeInline)
}

/**
 * Encode an array of Stencila `InlineContent` nodes to Pandoc `Inline` nodes.
 */
function encodeInlines(nodes: stencila.InlineContent[]): P.Inline[] {
  return nodes.map(encodeInline)
}

/**
 * Decode a Pandoc `Inline` node to a Stencila `InlineContent` node
 */
function decodeInline(node: P.Inline): stencila.InlineContent {
  switch (node.t) {
    case 'Space':
      return decodeSpace()
    case 'Str':
      return decodeStr(node)
    case 'Emph':
      return decodeEmph(node)
    case 'Strong':
      return decodeStrong(node)
    case 'Strikeout':
      return decodeStrikeout(node)
    case 'Quoted':
      return decodeQuoted(node)
    case 'Code':
      return decodeCode(node)
    case 'Link':
      return decodeLink(node)
    case 'Image':
      const image = decodeImage(node)
      // If the image is an rPNG then decode it and return
      // the embedded node
      const url = image.contentUrl
      if (url) {
        // TODO: currently assume url is local file, should we fetch remotes?
        const node = rpng.sniffDecodeSync(url)
        // TODO: avoid `as`
        if (typeof node !== 'undefined') return node as stencila.InlineContent
      }
      return image
    default:
      return decodeInlineToString(node)
  }
}

function encodeInline(node: stencila.Node): P.Inline {
  switch (nodeType(node)) {
    case 'string':
      return encodeString(node as string)
    case 'Emphasis':
      return encodeEmph(node as stencila.Emphasis)
    case 'Strong':
      return encodeStrong(node as stencila.Strong)
    case 'Delete':
      return encodeDelete(node as stencila.Delete)
    case 'Quote':
      return encodeQuote(node as stencila.Quote)
    case 'Code':
      return encodeCode(node as stencila.Code)
    case 'Link':
      return encodeLink(node as stencila.Link)
    case 'ImageObject':
      return encodeImageObject(node as stencila.ImageObject)
  }
  logger.warn(
    `Falling back to default encoding for inline node type ${nodeType(node)}.`
  )
  return encodeFallbackInline(node)
}

/**
 * Decode a Pandoc `Inline` node to a `string`.
 *
 * For some nodes the Stencila schema requires a `string` whereas
 * the Pandoc AST provides us with an array of inline nodes. An
 * example is the `alt` text for an image. This function is thus
 * intentionally lossy because it will ignore the fact that the
 * text is, for example, emphasized and just return it's string content.
 *
 * For a Pandoc `Note` (e.g. a footnote), the content of the note
 * is ignored. Pandoc `SoftBreak` and `LineBreak` nodes are also
 * decoded to an empty string. For all other nodes, the string
 * content of the node should be returned.
 */
function decodeInlineToString(node: P.Inline): string {
  switch (node.t) {
    case 'SoftBreak':
    case 'LineBreak':
    case 'Note':
      return ''
    case 'Space':
      return ' '
    case 'Str':
      return node.c
    case 'Code':
    case 'Math':
    case 'RawInline':
      return node.c[1]
    case 'Emph':
    case 'Strong':
    case 'Strikeout':
    case 'Superscript':
    case 'Subscript':
    case 'SmallCaps':
      return decodeInlinesToString(node.c)
    case 'Quoted':
    case 'Cite':
    case 'Link':
    case 'Image':
    case 'Span':
      return decodeInlinesToString(node.c[1])
  }
}

/**
 * Decode an array of Pandoc `Inline` nodes to a `string`.
 */
function decodeInlinesToString(nodes: P.Inline[]): string {
  return nodes.map(decodeInlineToString).join('')
}

/**
 * Decode a Pandoc `Space` to a `string`.
 */
function decodeSpace(): string {
  return ' '
}

/**
 * Decode a Pandoc `Str` to a `string`.
 */
function decodeStr(node: P.Str): string {
  return node.c
}

/**
 * Encode a `string` to a Pandoc `Str`.
 */
function encodeString(node: string): P.Str {
  return {
    t: 'Str',
    c: node
  }
}

/**
 * Decode a Pandoc `Emph` to a Stencila `Emphasis`.
 */
function decodeEmph(node: P.Emph): stencila.Emphasis {
  return {
    type: 'Emphasis',
    content: decodeInlines(node.c)
  }
}

/**
 * Encode a Stencila `Emphasis` to a Pandoc `Emph`.
 */
function encodeEmph(node: stencila.Emphasis): P.Emph {
  return {
    t: 'Emph',
    c: encodeInlines(node.content)
  }
}

/**
 * Decode a Pandoc `Strong` to a Stencila `Strong`.
 */
function decodeStrong(node: P.Strong): stencila.Strong {
  return {
    type: 'Strong',
    content: decodeInlines(node.c)
  }
}

/**
 * Encode a Stencila `Strong` to a Pandoc `Strong`.
 */
function encodeStrong(node: stencila.Strong): P.Strong {
  return {
    t: 'Strong',
    c: encodeInlines(node.content)
  }
}

/**
 * Decode a Pandoc `Strikeout` to a Stencila `Delete`.
 */
function decodeStrikeout(node: P.Strikeout): stencila.Delete {
  return {
    type: 'Delete',
    content: decodeInlines(node.c)
  }
}

/**
 * Encode a Stencila `Delete` to a Pandoc `Strikeout`.
 */
function encodeDelete(node: stencila.Delete): P.Strikeout {
  return {
    t: 'Strikeout',
    c: encodeInlines(node.content)
  }
}

/**
 * Decode a Pandoc `Quoted` to a Stencila `Quote`.
 *
 * Note: the type of quote, single or double, is ignored.
 */
function decodeQuoted(node: P.Quoted): stencila.Quote {
  return {
    type: 'Quote',
    content: decodeInlines(node.c[1])
  }
}

/**
 * Encode a Stencila `Quote` to a Pandoc `Quoted`.
 */
function encodeQuote(node: stencila.Quote): P.Quoted {
  return {
    t: 'Quoted',
    c: [{ t: P.QuoteType.SingleQuote }, encodeInlines(node.content)]
  }
}

/**
 * Decode a Pandoc `Code` to a Stencila `Code`.
 */
function decodeCode(node: P.Code): stencila.Code {
  const code: stencila.Code = {
    type: 'Code',
    value: node.c[1]
  }
  const attrs = decodeAttrs(node.c[0])
  if (attrs) {
    const language = attrs.classes ? attrs.classes.split(' ')[0] : null
    if (language) code.programmingLanguage = language
  }
  return code
}

/**
 * Encode a Stencila `Code` to a Pandoc `Code`.
 */
function encodeCode(node: stencila.Code): P.Code {
  const attrs = encodeAttrs({ classes: node.programmingLanguage || '' })
  return {
    t: 'Code',
    c: [attrs, node.value]
  }
}

/**
 * Decode a Pandoc `Link` to a Stencila `Link`.
 */
function decodeLink(node: P.Link): stencila.Link {
  const [target, title] = node.c[2]
  const link: stencila.Link = {
    type: 'Link',
    target,
    content: decodeInlines(node.c[1])
  }
  if (title) link.title = title
  const meta = decodeAttrs(node.c[0])
  if (meta) link.meta = meta
  return link
}

/**
 * Encode a Stencila `Link` to a Pandoc `Link`.
 */
function encodeLink(node: stencila.Link): P.Link {
  const [url, title] = [node.target, node.title || '']
  return {
    t: 'Link',
    c: [emptyAttrs, encodeInlines(node.content), [url, title]]
  }
}

/**
 * Decode a Pandoc `Image` to a Stencila `ImageObject`.
 *
 * Note: attributes are ignored.
 */
function decodeImage(image: P.Image): stencila.ImageObject {
  const alt = decodeInlinesToString(image.c[1])
  const [url, title] = image.c[2]
  return {
    type: 'ImageObject',
    contentUrl: url,
    title: title,
    text: alt
  }
}

/**
 * Encode a Stencila `ImageObject` to a Pandoc `Image`.
 */
function encodeImageObject(imageObject: stencila.ImageObject): P.Image {
  const url = imageObject.contentUrl || ''
  const title = imageObject.title || ''
  const alt: P.Inline[] = []
  if (imageObject.text) alt.push(encodeString(imageObject.text))
  return {
    t: 'Image',
    c: [emptyAttrs, alt, [url, title]]
  }
}

/**
 * Encode a Stencila `BlockContent` node as a Pandoc `Para` with
 * an rPNG. This is a fallback encoding for block nodes
 * not handled elsewhere.
 */
function encodeFallbackBlock(node: stencila.Node): P.Para {
  return {
    t: 'Para',
    c: [encodeFallbackInline(node)]
  }
}

/**
 * Encode a Stencila `InlineContent` node as a Pandoc `Image`
 * pointing to a rPNG. This is a fallback encoding for inline nodes
 * not handled elsewhere.
 */
function encodeFallbackInline(node: stencila.Node): P.Image {
  const imagePath = tempy.file({ extension: 'png' })
  const promise = (async () => {
    await write(node, imagePath, {
      ...defaultEncodeOptions,
      format: 'rpng',
      isStandalone: false
    })
  })()
  encodePromises.push(promise)

  const url = imagePath
  const title = nodeType(node)
  return {
    t: 'Image',
    c: [emptyAttrs, [], [url, title]]
  }
}

/**
 * Empty Pandoc element attributes
 */
export const emptyAttrs: P.Attr = ['', [], []]

/**
 * Decode Pandoc `Attr` attributes to an object
 */
function decodeAttrs(node: P.Attr): { [key: string]: string } | undefined {
  const attrs: { [key: string]: string } = {}
  if (node[0]) attrs.id = node[0]
  if (node[1] && node[1].length) attrs.classes = node[1].join(' ')
  for (const attr of node[2]) attrs[attr[0]] = attr[1]
  return Object.keys(attrs).length ? attrs : undefined
}

/**
 * Encode an object of attributes to a Pandoc `Attr`.
 */
function encodeAttrs(attrs: { [key: string]: string } = {}): P.Attr {
  const { id, classes, ...rest } = attrs
  return [id || '', classes ? classes.split(' ') : [], Object.entries(rest)]
}

/**
 * `Array.map` but for `objects`.
 */
function objectMap<Result>(
  obj: object,
  func: (key: string, value: any) => Result
): { [key: string]: Result } {
  return Object.assign(
    {},
    ...Object.entries(obj).map(([k, v]) => ({ [k]: func(k, v) }))
  )
}
