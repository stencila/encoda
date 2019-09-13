/**
 * @module pandoc
 */

import { getLogger } from '@stencila/logga'
import * as stencila from '@stencila/schema'
import {
  isBlockContent,
  isInlineContent,
  nodeType
} from '@stencila/schema/dist/util'
import childProcess from 'child_process'
import { makeBy } from 'fp-ts/lib/Array'
import tempy from 'tempy'
import { write } from '../..'
import { ensureBlockContent } from '../../util/content/ensureBlockContent'
import * as vfile from '../../util/vfile'
import { RPNGCodec } from '../rpng'
import { Codec, defaultEncodeOptions, GlobalEncodeOptions } from '../types'
import { binary, dataDir } from './binary'
import * as Pandoc from './types'
import { stringifyContent } from '../../util/content/stringifyContent'

const rpng = new RPNGCodec()

export { InputFormat, OutputFormat } from './types'

const log = getLogger('encoda:pandoc')

interface DecodeOptions {
  flags?: string[]
  ensureFile?: boolean
  from?: Pandoc.InputFormat
}

const defaultDecodeOptions = {
  ensureFile: false,
  from: Pandoc.InputFormat.json,
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
      format = Pandoc.OutputFormat.json,
      codecOptions = { flags: [], ensureFile: false }
    }: GlobalEncodeOptions<EncodeOptions> = this.defaultEncodeOptions
  ): Promise<vfile.VFile> => {
    encodePromises = []
    const { standalone, pdoc } = encodeNode(node)
    await Promise.all(encodePromises)

    const { flags = [], ensureFile = false } = codecOptions

    const args = [
      `--from=json`,
      `--to=${format === 'pandoc' ? Pandoc.OutputFormat.json : format}`
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
  log.debug(
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
        log.error(
          `Pandoc error!\n  message: ${stderr}  args:\n    ${args.join(
            '\n    '
          )}\n`
        )
        reject(new Error(stderr))
      } else {
        log.debug(`Pandoc success.`)
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
          log.debug('Pandoc EPIPE error')
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
function decodeDocument(pdoc: Pandoc.Document): stencila.Article {
  const { title = 'Untitled', ...meta } = decodeMeta(pdoc.meta)

  // Simplify the title to just a string if possible, otherwise
  // ensure it's just `BlockContent`
  const title_ =
    typeof title === 'string'
      ? title
      : stencila.isA('Paragraph', title)
      ? title.content.length === 1 && typeof title.content[0] === 'string'
        ? title.content[0]
        : title
      : (Array.isArray(title) ? title : [title]).filter(isBlockContent)

  // TODO: handle other meta data as necessary

  const content = decodeBlocks(pdoc.blocks)
  return {
    type: 'Article',
    title: typeof title_ === 'string' ? title_ : [title_],
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
): { standalone: boolean; pdoc: Pandoc.Document } {
  let standalone = false
  let meta: Pandoc.Meta = {}
  let blocks: Pandoc.Block[] = []

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

  const pdoc: Pandoc.Document = {
    'pandoc-api-version': Pandoc.Version,
    meta,
    blocks
  }

  return { standalone, pdoc }
}

/**
 * Decode a Pandoc `Meta` node to an `object`
 */
export function decodeMeta(
  meta: Pandoc.Meta
): { [key: string]: stencila.Node } {
  return objectMap(meta, (key, value) => decodeMetaValue(value))
}

/**
 * Encode an `object` of metadata into a Pandoc `Meta` node
 */
export function encodeMeta(obj: { [key: string]: any }): Pandoc.Meta {
  return objectMap(obj, (key, value) => encodeMetaValue(value))
}

/**
 * Decode a Pandoc `MetaValue` to a Stencila `Node`
 */
function decodeMetaValue(
  value: Pandoc.MetaValue
): stencila.Node | stencila.Node[] {
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
      return decodeBlocks(value.c)
  }
}

/**
 * Encode a Stencila `Node` to a Pandoc `MetaValue`
 *
 * For `null` and `number`, use a YAML "tags" syntax e.g. `!!null`
 * encoded into a Pandoc `MetaString`.
 */
function encodeMetaValue(node: stencila.Node): Pandoc.MetaValue {
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
function decodeBlocks(blocks: Pandoc.Block[]): stencila.BlockContent[] {
  return blocks.map(block => decodeBlock(block))
}

/**
 * Encode an array of Stencila `BlockContent` nodes.
 */
function encodeBlocks(nodes: stencila.BlockContent[]): Pandoc.Block[] {
  return nodes.map(node => encodeBlock(node))
}

/**
 * Decode a Pandoc `Block` element to a Stencila `BlockContent` node.
 */
function decodeBlock(block: Pandoc.Block): stencila.BlockContent {
  switch (block.t) {
    case 'Header':
      return decodeHeader(block)
    case 'Plain':
      return decodePlain(block)
    case 'Para':
      return decodePara(block)
    case 'BlockQuote':
      return decodeBlockQuote(block)
    case 'CodeBlock':
      return decodeCodeBlock(block)
    case 'BulletList':
    case 'OrderedList':
      return decodeList(block as Pandoc.OrderedList)
    case 'Table':
      return decodeTable(block)
    case 'HorizontalRule':
      return decodeHorizontalRule()
  }

  log.error(`Unhandled Pandoc node type "${block.t}"`)
  return decodePara({ t: 'Para', c: [] })
}

/**
 * Encode a Stencila `BlockContent` node to a Pandoc `Block` element.
 */
function encodeBlock(block: stencila.BlockContent): Pandoc.Block {
  switch (block.type) {
    case 'Heading':
      return encodeHeading(block)
    case 'Paragraph':
      return encodeParagraph(block)
    case 'QuoteBlock':
      return encodeQuoteBlock(block)
    case 'CodeBlock':
      return encodeCodeBlock(block)
    case 'CodeChunk':
      return encodeCodeChunk(block as stencila.CodeChunk)
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
function decodeHeader(node: Pandoc.Header): stencila.Heading {
  return {
    type: 'Heading',
    depth: node.c[0],
    content: decodeInlines(node.c[2])
  }
}

function encodeHeading(node: stencila.Heading): Pandoc.Header {
  return {
    t: 'Header',
    c: [node.depth, emptyAttrs, encodeInlines(node.content)]
  }
}

/**
 * Decode a Pandoc `Plain` to a Stencila `Paragraph`.
 */
function decodePlain(node: Pandoc.Plain): stencila.Paragraph {
  return stencila.paragraph(decodeInlines(node.c))
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
function decodePara(node: Pandoc.Para): stencila.BlockContent {
  const content = decodeInlines(node.c)
  if (content.length === 1) {
    const node = content[0]
    if (stencila.isA('CodeChunk', node)) return node
  }
  return {
    type: 'Paragraph',
    content
  }
}

function encodeParagraph(node: stencila.Paragraph): Pandoc.Para {
  return {
    t: 'Para',
    c: encodeInlines(node.content)
  }
}

/**
 * Decode a Pandoc `BlockQuote` to a Stencila `QuoteBlock`.
 */
function decodeBlockQuote(node: Pandoc.BlockQuote): stencila.QuoteBlock {
  return {
    type: 'QuoteBlock',
    content: decodeBlocks(node.c)
  }
}

/**
 * Encode a Stencila `QuoteBlock` to a Pandoc `BlockQuote`.
 */
function encodeQuoteBlock(node: stencila.QuoteBlock): Pandoc.BlockQuote {
  return {
    t: 'BlockQuote',
    c: encodeBlocks(node.content)
  }
}

/**
 * Decode a Pandoc `CodeBlock` to a Stencila `CodeBlock`.
 */
function decodeCodeBlock(node: Pandoc.CodeBlock): stencila.CodeBlock {
  const codeblock: stencila.CodeBlock = {
    type: 'CodeBlock',
    text: node.c[1]
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
function encodeCodeBlock(node: stencila.CodeBlock): Pandoc.CodeBlock {
  const attrs = encodeAttrs({ classes: node.programmingLanguage || '' })
  return {
    t: 'CodeBlock',
    c: [attrs, node.text]
  }
}

/**
 * Encode a Stencila `CodeChunk` to a Pandoc `Div` with an rPNG in it
 * and a `custom-style` attribute.
 */
function encodeCodeChunk(node: stencila.CodeChunk): Pandoc.Div {
  return {
    t: 'Div',
    c: [
      ['', [], [['custom-style', 'CodeChunk']]],
      [
        {
          t: 'Para',
          c: [encodeRPNG(node)]
        }
      ]
    ]
  }
}

/**
 * Decode a Pandoc `BulletList` or `OrderedList` to a Stencila `List`.
 */
function decodeList(
  node: Pandoc.BulletList | Pandoc.OrderedList
): stencila.List {
  const order = node.t === 'BulletList' ? 'unordered' : 'ascending'
  const blocks: Pandoc.Block[][] = node.t === 'BulletList' ? node.c : node.c[1]
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
function encodeList(
  node: stencila.List
): Pandoc.BulletList | Pandoc.OrderedList {
  const listAttrs: Pandoc.ListAttributes = [
    1,
    { t: Pandoc.ListNumberStyle.DefaultStyle },
    { t: Pandoc.ListNumberDelim.DefaultDelim }
  ]
  const blocks: Pandoc.Block[][] = node.items.map(listItem => {
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
function decodeTable(node: Pandoc.Table): stencila.Table {
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
function encodeTable(node: stencila.Table): Pandoc.Table {
  const columnCount = node.rows[0].cells.length

  const caption: Pandoc.Inline[] = []
  const aligns: { t: Pandoc.Alignment }[] = makeBy(columnCount, () => ({
    t: Pandoc.Alignment.AlignDefault
  }))

  const widths: number[] = makeBy(columnCount, () => 0)

  let head: Pandoc.TableCell[] = []

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
  let rows: Pandoc.TableCell[][] = []
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
function encodeThematicBreak(): Pandoc.HorizontalRule {
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
function decodeInlines(nodes: Pandoc.Inline[]): stencila.InlineContent[] {
  const inlines = []
  let previous: Pandoc.Inline | undefined
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
function encodeInlines(nodes: stencila.InlineContent[]): Pandoc.Inline[] {
  return nodes.map(encodeInline)
}

/**
 * Decode a Pandoc `Inline` node to a Stencila `InlineContent` node
 */
function decodeInline(node: Pandoc.Inline): stencila.InlineContent {
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
    case 'Subscript':
      return decodeSubscript(node)
    case 'Superscript':
      return decodeSuperscript(node)
    case 'Quoted':
      return decodeQuoted(node)
    case 'Code':
      return decodeCode(node)
    case 'Link':
      return decodeLink(node)
    case 'Cite':
      return decodeCite(node)
    case 'Image':
      const image = decodeImage(node)
      // If the image is an rPNG then decode it and return
      // the embedded node
      const url = image.contentUrl
      if (url) {
        const node = rpng.sniffDecodeSync(url)
        if (node !== undefined) return node as stencila.InlineContent
      }
      return image
    default:
      return decodeInlineToString(node)
  }
}

function encodeInline(node: stencila.Node): Pandoc.Inline {
  switch (nodeType(node)) {
    case 'string':
      return encodeString(node as string)
    case 'Emphasis':
      return encodeEmph(node as stencila.Emphasis)
    case 'Strong':
      return encodeStrong(node as stencila.Strong)
    case 'Delete':
      return encodeDelete(node as stencila.Delete)
    case 'Subscript':
      return encodeSubscript(node as stencila.Subscript)
    case 'Superscript':
      return encodeSuperscript(node as stencila.Superscript)
    case 'Quote':
      return encodeQuote(node as stencila.Quote)
    case 'CodeFragment':
      return encodeCodeFragment(node as stencila.CodeFragment)
    case 'CodeExpression':
      return encodeCodeExpression(node as stencila.CodeExpression)
    case 'Link':
      return encodeLink(node as stencila.Link)
    case 'Cite':
      return encodeCite(node as stencila.Cite)
    case 'ImageObject':
      return encodeImageObject(node as stencila.ImageObject)
  }
  log.warn(
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
function decodeInlineToString(node: Pandoc.Inline): string {
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
function decodeInlinesToString(nodes: Pandoc.Inline[]): string {
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
function decodeStr(node: Pandoc.Str): string {
  return node.c
}

/**
 * Encode a `string` to a Pandoc `Str`.
 */
function encodeString(node: string): Pandoc.Str {
  return {
    t: 'Str',
    c: node
  }
}

/**
 * Decode a Pandoc `Emph` to a Stencila `Emphasis`.
 */
function decodeEmph(node: Pandoc.Emph): stencila.Emphasis {
  return {
    type: 'Emphasis',
    content: decodeInlines(node.c)
  }
}

/**
 * Encode a Stencila `Emphasis` to a Pandoc `Emph`.
 */
function encodeEmph(node: stencila.Emphasis): Pandoc.Emph {
  return {
    t: 'Emph',
    c: encodeInlines(node.content)
  }
}

/**
 * Decode a Pandoc `Strong` to a Stencila `Strong`.
 */
function decodeStrong(node: Pandoc.Strong): stencila.Strong {
  return {
    type: 'Strong',
    content: decodeInlines(node.c)
  }
}

/**
 * Encode a Stencila `Strong` to a Pandoc `Strong`.
 */
function encodeStrong(node: stencila.Strong): Pandoc.Strong {
  return {
    t: 'Strong',
    c: encodeInlines(node.content)
  }
}

/**
 * Decode a Pandoc `Strikeout` to a Stencila `Delete`.
 */
function decodeStrikeout(node: Pandoc.Strikeout): stencila.Delete {
  return {
    type: 'Delete',
    content: decodeInlines(node.c)
  }
}

/**
 * Encode a Stencila `Delete` to a Pandoc `Strikeout`.
 */
function encodeDelete(node: stencila.Delete): Pandoc.Strikeout {
  return {
    t: 'Strikeout',
    c: encodeInlines(node.content)
  }
}

/**
 * Decode a Pandoc `Subscript` to a Stencila `Subscript`.
 */
function decodeSubscript(node: Pandoc.Subscript): stencila.Subscript {
  return {
    type: 'Subscript',
    content: decodeInlines(node.c)
  }
}

/**
 * Encode a Stencila `Subscript` to a Pandoc `Subscript`.
 */
function encodeSubscript(node: stencila.Subscript): Pandoc.Subscript {
  return {
    t: 'Subscript',
    c: encodeInlines(node.content)
  }
}

/**
 * Decode a Pandoc `Superscript` to a Stencila `Superscript`.
 */
function decodeSuperscript(node: Pandoc.Superscript): stencila.Superscript {
  return {
    type: 'Superscript',
    content: decodeInlines(node.c)
  }
}

/**
 * Encode a Stencila `Superscript` to a Pandoc `Superscript`.
 */
function encodeSuperscript(node: stencila.Superscript): Pandoc.Superscript {
  return {
    t: 'Superscript',
    c: encodeInlines(node.content)
  }
}

/**
 * Decode a Pandoc `Quoted` to a Stencila `Quote`.
 *
 * Note: the type of quote, single or double, is ignored.
 */
function decodeQuoted(node: Pandoc.Quoted): stencila.Quote {
  return {
    type: 'Quote',
    content: decodeInlines(node.c[1])
  }
}

/**
 * Encode a Stencila `Quote` to a Pandoc `Quoted`.
 */
function encodeQuote(node: stencila.Quote): Pandoc.Quoted {
  return {
    t: 'Quoted',
    c: [{ t: Pandoc.QuoteType.SingleQuote }, encodeInlines(node.content)]
  }
}

/**
 * Decode a Pandoc `Code` element to a Stencila `CodeFragment` node.
 */
function decodeCode(node: Pandoc.Code): stencila.CodeFragment {
  const code = stencila.codeFragment(node.c[1])
  const attrs = decodeAttrs(node.c[0])
  if (attrs) {
    const language = attrs.classes ? attrs.classes.split(' ')[0] : null
    if (language) code.programmingLanguage = language
  }
  return code
}

/**
 * Encode a Stencila `CodeFragment` node to a Pandoc `Code` element
 * with language in the class.
 */
function encodeCodeFragment(node: stencila.CodeFragment): Pandoc.Code {
  const attrs = encodeAttrs({ classes: node.programmingLanguage || '' })
  return {
    t: 'Code',
    c: [attrs, node.text]
  }
}

/**
 * Encode a Stencila `CodeExpression` to a Pandoc `Span` with an rPNG in it
 * and a `custom-style` attribute.
 */
function encodeCodeExpression(node: stencila.CodeExpression): Pandoc.Span {
  return {
    t: 'Span',
    c: [['', [], [['custom-style', 'CodeExpression']]], [encodeRPNG(node)]]
  }
}

/**
 * Decode a Pandoc `Link` to a Stencila `Link`.
 */
function decodeLink(node: Pandoc.Link): stencila.Link {
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
function encodeLink(node: stencila.Link): Pandoc.Link {
  const [url, title] = [node.target, node.title || '']
  return {
    t: 'Link',
    c: [emptyAttrs, encodeInlines(node.content), [url, title]]
  }
}

/**
 * Decode a Pandoc `Cite` to a Stencila `Cite`.
 */
function decodeCite(cite: Pandoc.Cite): stencila.Cite {
  // TODO: finish
  return stencila.cite('foo')
}

/**
 * Encode a Stencila `Cite` to a Pandoc `Cite`.
 */
function encodeCite(cite: stencila.Cite): Pandoc.Cite {
  // TODO: finish
  const { content = [] } = cite
  return {
    t: 'Cite',
    c: [[], encodeInlines(content)]
  }
}

/**
 * Decode a Pandoc `Image` to a Stencila `ImageObject`.
 *
 * Note: attributes are ignored.
 */
function decodeImage(image: Pandoc.Image): stencila.ImageObject {
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
function encodeImageObject(imageObject: stencila.ImageObject): Pandoc.Image {
  const url = imageObject.contentUrl || ''
  const title = stringifyContent(imageObject.title || '')
  const alt: Pandoc.Inline[] = []
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
function encodeFallbackBlock(node: stencila.Node): Pandoc.Para {
  return {
    t: 'Para',
    c: [encodeRPNG(node)]
  }
}

/**
 * Encode a Stencila `InlineContent` as a Pandoc `Image`.
 * This is a fallback encoding for inline nodes
 * not handled elsewhere.
 */
function encodeFallbackInline(node: stencila.Node): Pandoc.Image {
  return encodeRPNG(node)
}

/**
 * Encode a Stencila `Node` as a Pandoc `Image`
 * pointing to a rPNG.
 */
function encodeRPNG(node: stencila.Node): Pandoc.Image {
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
export const emptyAttrs: Pandoc.Attr = ['', [], []]

/**
 * Decode Pandoc `Attr` attributes to an object
 */
function decodeAttrs(node: Pandoc.Attr): { [key: string]: string } | undefined {
  const attrs: { [key: string]: string } = {}
  if (node[0]) attrs.id = node[0]
  if (node[1] && node[1].length) attrs.classes = node[1].join(' ')
  for (const attr of node[2]) attrs[attr[0]] = attr[1]
  return Object.keys(attrs).length ? attrs : undefined
}

/**
 * Encode an object of attributes to a Pandoc `Attr`.
 */
function encodeAttrs(attrs: { [key: string]: string } = {}): Pandoc.Attr {
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
