/**
 * [[include:src/codecs/pandoc/README.md]]
 *
 * @module codecs/pandoc
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
  isBlockContent,
  isInlineContent,
  nodeType,
} from '@stencila/schema'
import childProcess from 'child_process'
import Csl from 'csl-json'
import { makeBy } from 'fp-ts/lib/Array'
import path from 'path'
import tempy from 'tempy'
import { read } from '../..'
import { logWarnLossIfAny } from '../../util/logging'
import { ensureBlockContent } from '../../util/content/ensureBlockContent'
import {
  ensureBlockContentArray,
  ensureBlockContentArrayOrUndefined,
} from '../../util/content/ensureBlockContentArray'
import { ensureInlineContentArray } from '../../util/content/ensureInlineContentArray'
import { http } from '@stencila/jesta'
import transform, { transformSync } from '../../util/transform'
import * as vfile from '../../util/vfile'
import { decodeCsl, encodeCsl } from '../csl'
import { PngCodec } from '../png'
import { RpngCodec } from '../rpng'
import { TexCodec } from '../tex'
import { TxtCodec } from '../txt'
import { Codec, CommonDecodeOptions, CommonEncodeOptions } from '../types'
import { binary, citeprocBinaryPath, dataDir } from './binary'
import * as Pandoc from './types'

const pngCodec = new PngCodec()
const rpngCodec = new RpngCodec()
const texCodec = new TexCodec()

export { InputFormat, OutputFormat } from './types'

const log = getLogger('encoda:pandoc')

/**
 * Settings for derived codecs to use to
 * customize the decoding behavior for particular formats.
 * Not user options.
 */
export interface DecodeSettings {
  pandocFormat?: Pandoc.InputFormat
  pandocArgs?: string[]
  ensureFile?: boolean
}

/**
 * Settings for derived codecs to use to
 * customize the encoding behavior for particular formats.
 * Not user options.
 */
export interface EncodeSettings {
  pandocFormat?: Pandoc.OutputFormat
  pandocArgs?: string[]
  ensureFile?: boolean
  templatePath?: string
  useCiteproc?: boolean
  nodeInPng?: boolean
  nodeInAlt?: boolean
  nodeInLink?: boolean
}

export class PandocCodec extends Codec implements Codec {
  // Although this codec is usually used as a base for others (e.g `docx`),
  // the following definitions allow Pandoc JSON to be decoded or encoded
  // directly
  public readonly mediaTypes = ['application/pandoc+json']
  public readonly extNames = ['pandoc']

  /**
   * Decode a `VFile` to a `stencila.Node`.
   *
   * @param file The `VFile` to decode
   * @param options User options
   * @param settings Pandoc settings used by derived codecs
   * @returns A promise that resolves to a `stencila.Node`
   */
  public readonly decode = async (
    file: vfile.VFile,
    _options: CommonDecodeOptions = this.commonDecodeDefaults,
    settings: DecodeSettings = {}
  ): Promise<stencila.Node> => {
    const {
      pandocFormat = Pandoc.OutputFormat.json,
      pandocArgs = [],
      ensureFile = false,
    } = settings

    const args = [`--from=${pandocFormat}`, `--to=json`].concat(pandocArgs)

    const { path, contents } = file
    if (!contents || ensureFile) {
      if (ensureFile && !path) throw new Error('Must supply a file')
      args.push(`${path}`)
    }

    const json = await run(contents, args)
    const pdoc = JSON.parse(json)
    return decodeDocument(pdoc, path)
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
    options: CommonEncodeOptions = this.commonEncodeDefaults,
    settings: EncodeSettings = {}
  ): Promise<vfile.VFile> => {
    let { format, filePath } = { ...this.commonEncodeDefaults, ...options }

    const {
      pandocFormat = Pandoc.OutputFormat.json,
      pandocArgs = [],
      ensureFile = false,
      useCiteproc = false,
    } = settings

    const { standalone, pdoc } = encodeNode(
      await encodeDocumentAsync(node, settings)
    )

    const args = [`--from=json`, `--to=${pandocFormat}`]
    if (standalone) args.push('--standalone')
    for (const option of pandocArgs) {
      if (!(!standalone && option.startsWith('--template'))) args.push(option)
    }

    if ((filePath && filePath !== '-') || ensureFile) {
      let output
      if (!filePath || filePath === '-') {
        // Create a new file path, which is returned as `vfile.path`
        output = nodeType(node).toLowerCase()
        if (format !== undefined) output += `.${format}`
        filePath = output
      } else output = filePath
      args.push(`--output=${output}`)
    }

    const json = JSON.stringify(pdoc)
    const content = await run(json, args, useCiteproc)

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
 * Run the Pandoc binary
 *
 * For performance, only filter using `pandoc-citeproc` is necessary.
 */
export function run(
  input: string | Buffer | Uint8Array,
  args: string[],
  useCiteproc = false
): Promise<string> {
  args.push(`--data-dir=${dataDir}`)

  if (useCiteproc) args.push(`--filter=${citeprocBinaryPath}`)

  log.debug(
    `Pandoc spawn\n  path: ${binary.path()}\n  args:\n    ${args.join(
      '\n    '
    )}`
  )
  return new Promise((resolve, reject) => {
    const child = childProcess.spawn(binary.path(), args)

    // If there's an error also show the input in the debug log
    function raise(error: Error): void {
      log.debug(`${error}\n  input: ${input}`)
      reject(error)
    }

    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (data) => {
      stdout += data
    })
    child.stderr.on('data', (data) => {
      stderr += data
    })
    child.on('close', () => {
      if (stderr) {
        if (stderr.includes('[WARNING]')) {
          stderr
            .split('\n')
            .map((line) => log.warn(line.replace(/\[WARNING\] /, '')))
        } else return raise(new Error(stderr))
      }
      log.debug(`Pandoc success.`)
      resolve(stdout)
    })
    child.on('error', (err) => {
      raise(err)
    })

    if (input?.length) {
      child.stdin.on('error', (err) => {
        // Ignore errors where Pandoc closes stdin
        // before we finish writing to it.
        // @ts-ignore
        if (err.code === 'EPIPE') {
          log.debug('Pandoc EPIPE error')
        } else {
          raise(err)
        }
      })

      child.stdin.write(input)
      child.stdin.end()
    }
  })
}

/**
 * Do any asynchronous encoding of a Pandoc `Document` before doing
 * synchronous encoding.
 */
async function encodeDocumentAsync(
  node: stencila.Node,
  settings: EncodeSettings
): Promise<stencila.Node> {
  return transform(node, async (node) => {
    switch (stencila.nodeType(node)) {
      case 'CodeExpression':
        return encodeCodeExpression(node as stencila.CodeExpression, settings)
      case 'CodeChunk':
        return encodeCodeChunk(node as stencila.CodeChunk, settings)

      case 'MathFragment':
        return encodeMath(node as stencila.MathFragment, 'InlineMath')
      case 'MathBlock':
        return encodeMath(node as stencila.MathBlock, 'DisplayMath')
    }
    return node
  })
}

/**
 * Decode a Pandoc `Document` to a Stencila `Article`.
 */
async function decodeDocument(
  pdoc: Pandoc.Document,
  docPath?: string
): Promise<stencila.Article> {
  const meta = await decodeMeta(pdoc.meta, docPath)

  /**
   * Do any asynchronous decoding of a Pandoc `Document` before doing
   * synchronous decoding.
   */
  const blocks = (await transform(pdoc.blocks, async (elem) => {
    if (elem === null || (typeof elem === 'object' && !('t' in elem)))
      return elem

    const { t } = elem as Pandoc.Block | Pandoc.Inline
    switch (t) {
      case 'Image': {
        const image = decodeImage(elem as Pandoc.Image)
        // If the image is an rPNG then decode it and return
        // the embedded node
        const { contentUrl } = image
        if (contentUrl) {
          const node = await rpngCodec.sniffDecode(contentUrl)
          if (node !== undefined) return node
        }
      }
    }
    return elem
  })) as Pandoc.Document['blocks']

  const content = decodeBlocks(blocks)

  return stencila.article({ ...meta, content })
}

/**
 * Encode a Stencila `Node` node to a Pandoc `Document`.
 *
 * This function is intended to be the inverse of `decodeDocument`
 * (although it is not yet).
 *
 * If the node is an `Article` with `references` then those are
 * converted to CSL JSON and included in the Pandoc document's
 * `meta` so that `pandoc-citeproc` can recognize them.
 */
function encodeNode(node: stencila.Node): {
  standalone: boolean
  pdoc: Pandoc.Document
} {
  let standalone = false
  let meta: Pandoc.Meta = {}
  let blocks: Pandoc.Block[] = []

  const type_ = nodeType(node)
  if (type_ === 'Article') {
    const { type, content, references, ...rest } = node as stencila.Article
    standalone = true

    // Transform meta data as necessary before encoding it
    meta = encodeMeta(
      references
        ? {
            ...rest,
            references: references
              .filter(stencila.isMember('CreativeWorkTypes'))
              .map((ref) => encodeCsl(ref, 'json')),
          }
        : rest
    )

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
    blocks,
  }

  return { standalone, pdoc }
}

/**
 * Decode a Pandoc `Meta` node to an `object`.
 *
 * This function also translates the names / values
 * of Pandoc meta data (e.g. as used in template) to
 * names / values used in Stencila schema.
 */
export async function decodeMeta(
  meta: Pandoc.Meta,
  docPath?: string
): Promise<Record<string, stencila.Node>> {
  const { title, author, date, bibliography, references, ...rest } = objectMap(
    meta,
    (_, value) => decodeMetaValue(value)
  )

  if (title !== undefined) {
    rest.title =
      typeof title === 'string'
        ? title
        : stencila.isA('Paragraph', title)
        ? title.content.length === 1 && typeof title.content[0] === 'string'
          ? title.content[0]
          : title
        : (Array.isArray(title) ? title : [title]).filter(isBlockContent)
  }

  if (author !== undefined && Array.isArray(author) && author.length > 0) {
    rest.authors = author
  }

  if (date !== undefined) {
    const content = TxtCodec.stringify(date)
    if (content.length > 0) rest.datePublished = content
  }

  // Pandoc uses the `bibliography` metadata field to refer to an
  // external file (usually a .bib file) and the `references` metadata
  // field as "a list of citations in CSL YAML format". This
  // section deals with both of those cases.
  if (references !== undefined) {
    const csl = references as Csl.Data[]
    rest.references = await Promise.all(csl.map((item) => decodeCsl(item)))
  } else if (bibliography !== undefined) {
    const relativePath = TxtCodec.stringify(bibliography)
    const absolutePath = path.join(
      docPath !== undefined ? path.dirname(docPath) : '.',
      relativePath
    )
    rest.references = await read(absolutePath)
  }

  return rest
}

/**
 * Encode an `object` of metadata into a Pandoc `Meta` node
 */
export function encodeMeta(obj: { [key: string]: any }): Pandoc.Meta {
  return objectMap(obj, (_, value) => encodeMetaValue(value))
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
    case 'MetaString': {
      if (value.c === '!!null') return null
      if (value.c.startsWith('!!number ')) {
        return parseFloat(value.c.slice(9))
      }
      const int = parseInt(value.c)
      return isNaN(int) ? value.c : int
    }
    case 'MetaList':
      return value.c.map(decodeMetaValue)
    case 'MetaMap':
      return objectMap(value.c, (key, value) => decodeMetaValue(value))
    case 'MetaInlines':
      return {
        type: 'Paragraph',
        content: decodeInlines(value.c),
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
function encodeMetaValue(node: stencila.Node): Pandoc.MetaValue | undefined {
  if (node === undefined) return undefined
  switch (nodeType(node)) {
    case 'Null':
      return {
        t: 'MetaString',
        c: '!!null',
      }
    case 'Boolean':
      return {
        t: 'MetaBool',
        c: node as boolean,
      }
    case 'Number':
      return {
        t: 'MetaString',
        c: Number.isInteger(node as number) ? `${node}` : `!!number ${node}`,
      }
    case 'String':
      return {
        t: 'MetaString',
        c: node as string,
      }
    case 'Array':
      return {
        t: 'MetaList',
        c: (node as any[]).reduce((prev: Pandoc.MetaValue[], curr) => {
          const result = encodeMetaValue(curr)
          return result !== undefined ? [...prev, result] : prev
        }, []),
      }
    case 'Paragraph':
      return {
        t: 'MetaInlines',
        c: encodeInlines((node as stencila.Paragraph).content),
      }
    case 'QuoteBlock':
      return {
        t: 'MetaBlocks',
        c: encodeBlocks((node as stencila.QuoteBlock).content),
      }
    // For both plain objects, and object with `type`, create a `MetaMap`
    case 'Object':
    default:
      return {
        t: 'MetaMap',
        c: objectMap(node as object, (key, value) => encodeMetaValue(value)),
      }
  }
}

/**
 * Decode an array of Pandoc `Block` elements.
 */
function decodeBlocks(blocks: Pandoc.Block[]): stencila.BlockContent[] {
  return blocks.map((block) => decodeBlock(block))
}

/**
 * Encode an array of Stencila `BlockContent` nodes.
 */
function encodeBlocks(nodes: stencila.BlockContent[]): Pandoc.Block[] {
  return nodes.map((node) => encodeBlock(node))
}

/**
 * Decode a Pandoc `Block` element to a Stencila `BlockContent` node.
 */
function decodeBlock(elem: Pandoc.Block): stencila.BlockContent {
  // Already decoded elements (e.g. in `decodeDocumentAsync`)
  if (stencila.isBlockContent(elem)) return elem

  switch (elem.t) {
    case 'Header':
      return decodeHeader(elem)
    case 'Plain':
      return decodePlain(elem)
    case 'Para':
      return decodePara(elem)
    case 'BlockQuote':
      return decodeBlockQuote(elem)
    case 'CodeBlock':
      return decodeCodeBlock(elem)
    case 'BulletList':
    case 'OrderedList':
      return decodeList(elem as Pandoc.OrderedList)
    case 'Table':
      return decodeTable(elem)
    case 'HorizontalRule':
      return decodeHorizontalRule()
    case 'Div':
      return decodeDiv(elem)
  }

  log.error(`Unhandled Pandoc node type "${elem.t}"`)
  return decodePara({ t: 'Para', c: [] })
}

/**
 * Encode a Stencila `BlockContent` node to a Pandoc `Block` element.
 */
function encodeBlock(node: stencila.BlockContent): Pandoc.Block {
  // Already encoded nodes
  if (Pandoc.isBlock(node)) return node

  switch (node.type) {
    case 'Heading':
      return encodeHeading(node)
    case 'Paragraph':
      return encodeParagraph(node)
    case 'QuoteBlock':
      return encodeQuoteBlock(node)
    case 'CodeBlock':
      return encodeCodeBlock(node)
    case 'List':
      return encodeList(node)
    case 'Table':
      return encodeTable(node)
    case 'Figure':
      return encodeFigure(node)
    case 'Collection':
      return encodeCollection(node)
    case 'ThematicBreak':
      return encodeThematicBreak()
  }
  return encodeFallbackBlock(node)
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
    content: decodeInlines(node.c[2]),
  }
}

function encodeHeading(node: stencila.Heading): Pandoc.Header {
  const { depth = 1 } = node
  return {
    t: 'Header',
    c: [depth, emptyAttrs, encodeInlines(node.content)],
  }
}

/**
 * Decode a Pandoc `Plain` to a Stencila `Paragraph`.
 */
function decodePlain(node: Pandoc.Plain): stencila.Paragraph {
  return stencila.paragraph({ content: decodeInlines(node.c) })
}

/**
 * Decode a Pandoc `Para` to a Stencila `Paragraph` or
 * other `BlockContent` node.
 *
 * A Pandoc `Para` may act as a wrapper for a single element that Stencila
 * treats as block, rather than inline. For example, a Stencila `MathBlock`
 * is encoded as a Pandoc `Para` with a single `DisplayMath` `Math` element.
 * Also a paragraph is used to wrap rPNGs for `CodeChunk`s. Given that, this
 * function checks for such encoded elements in a paragraph and returns
 * them if they are the only child node.
 */
function decodePara(node: Pandoc.Para): stencila.BlockContent {
  const content = decodeInlines(node.c)
  if (content.length === 1) {
    const node = content[0]
    if (stencila.isA('CodeChunk', node) || stencila.isA('MathBlock', node))
      return node
  }
  return {
    type: 'Paragraph',
    content,
  }
}

function encodeParagraph(node: stencila.Paragraph): Pandoc.Para {
  return {
    t: 'Para',
    c: encodeInlines(node.content),
  }
}

/**
 * Decode a Pandoc `BlockQuote` to a Stencila `QuoteBlock`.
 */
function decodeBlockQuote(node: Pandoc.BlockQuote): stencila.QuoteBlock {
  return {
    type: 'QuoteBlock',
    content: decodeBlocks(node.c),
  }
}

/**
 * Encode a Stencila `QuoteBlock` to a Pandoc `BlockQuote`.
 */
function encodeQuoteBlock(node: stencila.QuoteBlock): Pandoc.BlockQuote {
  return {
    t: 'BlockQuote',
    c: encodeBlocks(node.content),
  }
}

/**
 * Decode a Pandoc `CodeBlock` to a Stencila `CodeBlock`.
 */
function decodeCodeBlock(node: Pandoc.CodeBlock): stencila.CodeBlock {
  let programmingLanguage
  let meta
  const attrs = decodeAttrs(node.c[0])
  if (attrs) {
    const { language, classes, ...rest } = attrs
    if (language) programmingLanguage = language
    else if (classes) programmingLanguage = classes
    meta = Object.keys(rest).length > 0 ? rest : undefined
  }

  const text = node.c[1]

  return stencila.codeBlock({ text, programmingLanguage, meta })
}

/**
 * Encode a Stencila `CodeBlock` to a Pandoc `CodeBlock`.
 */
function encodeCodeBlock(node: stencila.CodeBlock): Pandoc.CodeBlock {
  const attrs = encodeAttrs({ classes: node.programmingLanguage ?? '' })
  return {
    t: 'CodeBlock',
    c: [attrs, node.text],
  }
}

/**
 * Encode a Stencila `CodeChunk` to a Pandoc `Div` with an rPNG in it
 * and a `custom-style` attribute.
 *
 * This removes the `label` and `caption` from the code chunk so that they
 * can be edited by the user in the usual manner. See `reshape` for
 * how these are then reconsitituted based on styles etc.
 */
async function encodeCodeChunk(
  chunk: stencila.CodeChunk,
  settings: EncodeSettings
): Promise<Pandoc.Div> {
  const { label, caption, ...rest } = chunk

  const mainDiv: Pandoc.Div = {
    t: 'Div',
    c: [
      ['', [], [['custom-style', 'Code Chunk']]],
      [
        {
          t: 'Para',
          c: [await encodeRpng(rest, settings)],
        },
      ],
    ],
  }

  const captionInlines = encodeCaption(label, caption)
  if (captionInlines.length === 0) return mainDiv

  const isTable = label !== undefined && /^\s*Table/i.test(label)
  const captionStyle = isTable ? 'Table Caption' : 'Figure Caption'

  const captionDiv: Pandoc.Div = {
    t: 'Div',
    c: [
      ['', [], [['custom-style', captionStyle]]],
      [{ t: 'Para', c: captionInlines }],
    ],
  }

  return {
    t: 'Div',
    c: [['', [], []], isTable ? [captionDiv, mainDiv] : [mainDiv, captionDiv]],
  }
}

/**
 * Decode a Pandoc `BulletList` or `OrderedList` to a Stencila `List`.
 */
function decodeList(
  node: Pandoc.BulletList | Pandoc.OrderedList
): stencila.List {
  const order = node.t === 'BulletList' ? 'Unordered' : 'Ascending'
  const blocks: Pandoc.Block[][] = node.t === 'BulletList' ? node.c : node.c[1]
  return {
    type: 'List',
    order,
    items: blocks.map((block) => ({
      type: 'ListItem',
      content: decodeBlocks(block),
    })),
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
    { t: Pandoc.ListNumberDelim.DefaultDelim },
  ]
  const blocks: Pandoc.Block[][] = node.items.map((item) => {
    const { content = [] } = item
    return content.map(ensureBlockContent).map(encodeBlock)
  })
  if (node.order === 'Ascending') {
    return { t: 'OrderedList', c: [listAttrs, blocks] }
  } else {
    return { t: 'BulletList', c: blocks }
  }
}

/**
 * Decode a Pandoc `Table` to a Stencila `Table`
 *
 * Note: column alignments and widths (`node.c[1]` and `node.c[2]`
 * respectively) are currently ignored.
 */
function decodeTable(node: Pandoc.Table): stencila.Table {
  const caption = ensureBlockContentArrayOrUndefined(decodeInlines(node.c[0]))

  // Pandoc always produces a header row: an array of arrays
  // of the same length as the number of columns.
  // However this may be empty, in which case, we do not want
  // to propagate this row
  const header = node.c[3].map(decodeBlocks)
  const headerIsEmpty = header.filter((cell) => cell.length > 0).length === 0
  const headerRows = headerIsEmpty
    ? []
    : [
        stencila.tableRow({
          rowType: 'Header',
          cells: header.map(
            (cell: stencila.BlockContent[]): stencila.TableCell =>
              stencila.tableCell({
                cellType: 'Header',
                content: cell,
              })
          ),
        }),
      ]

  const data = node.c[4].map((row) => row.map(decodeBlocks))
  const dataRows = data.map(
    (row: stencila.BlockContent[][]): stencila.TableRow =>
      stencila.tableRow({
        cells: row.map(
          (cell: stencila.BlockContent[]): stencila.TableCell =>
            stencila.tableCell({
              content: cell,
            })
        ),
      })
  )

  return stencila.table({
    caption,
    rows: [...headerRows, ...dataRows],
  })
}

/**
 * Encode Stencila `Table` to a Pandoc `Table`.
 */
function encodeTable(table: stencila.Table): Pandoc.Table {
  const { label, caption } = table
  const captionInlines = encodeCaption(label, caption)

  const columnCount = table.rows[0].cells.length
  const aligns: { t: Pandoc.Alignment }[] = makeBy(columnCount, () => ({
    t: Pandoc.Alignment.AlignDefault,
  }))
  const widths: number[] = makeBy(columnCount, () => 0)

  let head: Pandoc.TableCell[] = []
  if (table.rows.length > 0) {
    head = table.rows[0].cells.map((cell) =>
      encodeBlocks(ensureBlockContentArray(cell.content ?? []))
    )
  }

  let rows: Pandoc.TableCell[][] = []
  if (table.rows.length > 1) {
    rows = table.rows.slice(1).map((row: stencila.TableRow) => {
      return row.cells.map((cell) =>
        encodeBlocks(ensureBlockContentArray(cell.content ?? []))
      )
    })
  }
  return {
    t: 'Table',
    c: [captionInlines, aligns, widths, head, rows],
  }
}

/**
 * Encode a `Figure` to a Pandoc `Div` with a custom style.
 *
 * Note that Pandoc does not yet have a specific figure element (analogous to `Table`
 * for example). See:
 *   https://github.com/jgm/pandoc/issues/3177
 *   https://stackoverflow.com/questions/47613327/add-a-figure-element-in-pandoc-with-filters
 *
 * This encoding results in a similar structure to that used by Pandoc for tables
 * with a `Figure Caption` custom class analogous to the `Table Caption` custom class.
 */
function encodeFigure(figure: stencila.Figure): Pandoc.Div {
  const { label, caption, content = [] } = figure
  const contentDiv: Pandoc.Div = {
    t: 'Div',
    c: [
      ['', [], [['custom-style', 'Figure Content']]],
      encodeBlocks(ensureBlockContentArray(content)),
    ],
  }
  const captionDiv: Pandoc.Div = {
    t: 'Div',
    c: [
      ['', [], [['custom-style', 'Figure Caption']]],
      [
        {
          t: 'Para',
          c: encodeCaption(label, caption),
        },
      ],
    ],
  }
  return {
    t: 'Div',
    c: [
      ['', [], []],
      [contentDiv, captionDiv],
    ],
  }
}

/**
 * Transform the `label` and `caption` of a `Table`, `Figure` or `CodeChunk`
 * into Pandoc inline nodes.
 */
function encodeCaption(
  label: string | undefined,
  caption: string | stencila.Node[] | undefined
): Pandoc.Inline[] {
  let inlines: stencila.InlineContent[] = []

  // Prefix the caption with the label
  if (label !== undefined) inlines = [label, label.endsWith('.') ? ' ' : '. ']

  // Headings cause the custom style in formats like DOCX to
  // be "broken up" so replace with strong (character style) content
  if (caption !== undefined)
    inlines = [
      ...inlines,
      ...ensureInlineContentArray(
        transformSync(caption, (node) => {
          if (stencila.isA('Heading', node))
            return stencila.strong({ content: node.content })
          return node
        })
      ),
    ]

  return encodeInlines(inlines)
}

/**
 * Encode a `Collection` to Pandoc by encoding each part.
 */
function encodeCollection(node: stencila.Collection): Pandoc.Div | Pandoc.Para {
  const { parts, meta, ...lost } = node
  logWarnLossIfAny('pandoc', 'encode', node, lost)

  if (meta?.usage === 'figGroup') {
    return {
      t: 'Div',
      c: [
        ['', [], [['custom-style', 'Figure Group']]],
        parts.map((part) => encodeFigure(part as stencila.Figure)),
      ],
    }
  }
  log.warn(`Unhandled Collection with meta: ${JSON.stringify(meta)}`)
  return encodeParagraph(stencila.paragraph({ content: [] }))
}

/**
 * Decode a Pandoc `HorizontalRule` to a Stencila `ThematicBreak`
 */
function decodeHorizontalRule(): stencila.ThematicBreak {
  return {
    type: 'ThematicBreak',
  }
}

/**
 * Encode a Stencila `ThematicBreak` to a Pandoc `HorizontalRule`
 */
function encodeThematicBreak(): Pandoc.HorizontalRule {
  return {
    t: 'HorizontalRule',
    c: undefined,
  }
}

/**
 * Unwrap a Pandoc `Div` to a Stencila `BlockContent` node with meta attributes.
 *
 * Pandoc uses a `Div` to wrap a paragraph etc and add attributes like "custom-style"
 * (a Pandoc `Para` can not have attributes). We instead unwrap the child and
 * add the attributes to it's `meta`. These can then be used in other functions
 * to apply semantic inference.
 */
function decodeDiv(div: Pandoc.Div): stencila.BlockContent {
  const { id, ...rest } =
    decodeAttrs(div.c[0], { 'custom-style': 'style' }) ?? {}

  const style = rest.style
  if (style) {
    // Do not retain styles that have unsemantic names. This is for brevity
    // but also to avoid temptation to use them for semantic inference.
    if (
      [
        'default',
        'normal',
        'body',
        'text',
        'text body',
        'text default',
        'default text',
        'body text',
        'block text',
        'paragraph',
        'first paragraph',
      ].includes(style.toLowerCase())
    ) {
      delete rest.style
    }
  }

  if (div.c[1].length > 1)
    log.warn('Pandoc Div has more than one child, only first will be used.')
  const node = decodeBlock(div.c[1][0])

  let meta: object | undefined = { ...node.meta, ...rest }
  if (Object.keys(meta).length === 0) meta = undefined

  return { ...node, id, meta }
}

/**
 * Decode an array of Pandoc `Inline` nodes to Stencila `InlineContent` nodes.
 *
 * Merges contiguous `Str` and `Space` elements prior to decoding. Will also
 * unwrap a Pandoc `Span` (produced for `docx+styles`; no analogous node type in Stencila)
 */
function decodeInlines(nodes: Pandoc.Inline[]): stencila.InlineContent[] {
  const unwrapped = nodes.reduce(
    (prev: Pandoc.Inline[], node) =>
      node.t === 'Span' ? [...prev, ...node.c[1]] : [...prev, node],
    []
  )

  const inlines = []
  let previous: Pandoc.Inline | undefined
  for (const node of unwrapped) {
    if (
      previous?.t === 'Str' &&
      (node.t === 'Space' || node.t === 'SoftBreak' || node.t === 'Str')
    ) {
      if (node.t === 'Space' || node.t === 'SoftBreak') previous.c += ' '
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
function decodeInline(elem: Pandoc.Inline): stencila.InlineContent {
  // Already decoded elements (e.g. in `decodeDocumentAsync`)
  // Allow for blocks such as `CodeChunk` nodes which may be wrapped in
  // a paragraph. See also `decodePara`
  if (
    stencila.isEntity(elem) &&
    (stencila.isInlineContent(elem) || stencila.isBlockContent(elem))
  )
    return elem as stencila.InlineContent

  switch (elem.t) {
    case 'Space':
      return decodeSpace()
    case 'Str':
      return decodeStr(elem)
    case 'Emph':
      return decodeEmph(elem)
    case 'Strong':
      return decodeStrong(elem)
    case 'Strikeout':
      return decodeStrikeout(elem)
    case 'Subscript':
      return decodeSubscript(elem)
    case 'Superscript':
      return decodeSuperscript(elem)
    case 'Quoted':
      return decodeQuoted(elem)
    case 'Code':
      return decodeCode(elem)
    case 'Math':
      // It is necessary to cast to inline
      // content here because `Math` may be decoded to a `MathBlock`
      // See also `decodePara`
      return decodeMath(elem) as stencila.InlineContent
    case 'Link':
      return decodeLink(elem)
    case 'Cite':
      return decodeCite(elem)
    case 'Image':
      return decodeImage(elem)
    default:
      return decodeInlineToString(elem)
  }
}

function encodeInline(node: stencila.Node): Pandoc.Inline {
  // Already encoded nodes
  if (Pandoc.isInline(node)) return node

  switch (nodeType(node)) {
    case 'Null':
    case 'Boolean':
    case 'Number':
    case 'Array':
    case 'Object':
      return encodePrimitive(node)
    case 'String':
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
    case 'Link':
      return encodeLink(node as stencila.Link)
    case 'Cite':
      return encodeCite(node as stencila.Cite)
    case 'CiteGroup':
      return encodeCiteGroup(node as stencila.CiteGroup)
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
    c: node,
  }
}

/**
 * Encode a primitive node e.g. `Boolean`, `Array` to a Pandoc `Str`.
 */
function encodePrimitive(
  node: null | boolean | number | string | Array<unknown> | object
): Pandoc.Str {
  return {
    t: 'Str',
    c: TxtCodec.stringify(node),
  }
}

/**
 * Decode a Pandoc `Emph` to a Stencila `Emphasis`.
 */
function decodeEmph(node: Pandoc.Emph): stencila.Emphasis {
  return {
    type: 'Emphasis',
    content: decodeInlines(node.c),
  }
}

/**
 * Encode a Stencila `Emphasis` to a Pandoc `Emph`.
 */
function encodeEmph(node: stencila.Emphasis): Pandoc.Emph {
  return {
    t: 'Emph',
    c: encodeInlines(node.content),
  }
}

/**
 * Decode a Pandoc `Strong` to a Stencila `Strong`.
 */
function decodeStrong(node: Pandoc.Strong): stencila.Strong {
  return {
    type: 'Strong',
    content: decodeInlines(node.c),
  }
}

/**
 * Encode a Stencila `Strong` to a Pandoc `Strong`.
 */
function encodeStrong(node: stencila.Strong): Pandoc.Strong {
  return {
    t: 'Strong',
    c: encodeInlines(node.content),
  }
}

/**
 * Decode a Pandoc `Strikeout` to a Stencila `Delete`.
 */
function decodeStrikeout(node: Pandoc.Strikeout): stencila.Delete {
  return {
    type: 'Delete',
    content: decodeInlines(node.c),
  }
}

/**
 * Encode a Stencila `Delete` to a Pandoc `Strikeout`.
 */
function encodeDelete(node: stencila.Delete): Pandoc.Strikeout {
  return {
    t: 'Strikeout',
    c: encodeInlines(node.content),
  }
}

/**
 * Decode a Pandoc `Subscript` to a Stencila `Subscript`.
 */
function decodeSubscript(node: Pandoc.Subscript): stencila.Subscript {
  return {
    type: 'Subscript',
    content: decodeInlines(node.c),
  }
}

/**
 * Encode a Stencila `Subscript` to a Pandoc `Subscript`.
 */
function encodeSubscript(node: stencila.Subscript): Pandoc.Subscript {
  return {
    t: 'Subscript',
    c: encodeInlines(node.content),
  }
}

/**
 * Decode a Pandoc `Superscript` to a Stencila `Superscript`.
 */
function decodeSuperscript(node: Pandoc.Superscript): stencila.Superscript {
  return {
    type: 'Superscript',
    content: decodeInlines(node.c),
  }
}

/**
 * Encode a Stencila `Superscript` to a Pandoc `Superscript`.
 */
function encodeSuperscript(node: stencila.Superscript): Pandoc.Superscript {
  return {
    t: 'Superscript',
    c: encodeInlines(node.content),
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
    content: decodeInlines(node.c[1]),
  }
}

/**
 * Encode a Stencila `Quote` to a Pandoc `Quoted`.
 */
function encodeQuote(node: stencila.Quote): Pandoc.Quoted {
  return {
    t: 'Quoted',
    c: [{ t: Pandoc.QuoteType.SingleQuote }, encodeInlines(node.content)],
  }
}

/**
 * Decode a Pandoc `Code` element to a Stencila `CodeFragment` node.
 */
function decodeCode(node: Pandoc.Code): stencila.CodeFragment {
  let programmingLanguage
  let meta
  const attrs = decodeAttrs(node.c[0])
  if (attrs) {
    const { language, classes, ...rest } = attrs
    if (language) programmingLanguage = language
    else if (classes) programmingLanguage = classes
    meta = Object.keys(rest).length > 0 ? rest : undefined
  }

  const text = node.c[1]

  return stencila.codeFragment({ text, programmingLanguage, meta })
}

/**
 * Encode a Stencila `CodeFragment` node to a Pandoc `Code` element
 * with language in the class.
 */
function encodeCodeFragment(node: stencila.CodeFragment): Pandoc.Code {
  const attrs = encodeAttrs({ classes: node.programmingLanguage ?? '' })
  return {
    t: 'Code',
    c: [attrs, node.text],
  }
}

/**
 * Encode a Stencila `CodeExpression` to a Pandoc `Span` with an rPNG in it
 * and a `custom-style` attribute.
 */
async function encodeCodeExpression(
  node: stencila.CodeExpression,
  settings: EncodeSettings
): Promise<Pandoc.Span> {
  return {
    t: 'Span',
    c: [
      ['', [], [['custom-style', 'Code Expression']]],
      [await encodeRpng(node, settings)],
    ],
  }
}

/**
 * Decode a Pandoc `Math` element to a Stencila `Math` node.
 */
function decodeMath(elem: Pandoc.Math): stencila.Math {
  const {
    c: [{ t: mathType }, text],
  } = elem
  return mathType === 'InlineMath'
    ? stencila.mathFragment({ text })
    : stencila.mathBlock({ text })
}

/**
 * Encode a Stencila `Math` node to a Pandoc `Math` or `Para` element.
 *
 * `MathBlock` nodes are wrapped into a Pandoc `Para`, as Pandoc does
 * for `DisplayMath`. If the necessary, the math `text` is translated to TeX
 * (the math language that Pandoc assumes). If no translation is possible
 * a warning is logged and the Tex is empty
 *
 * @param node The Stencila `Math` node to encode
 * @param pandocType The Pandoc element type to encode as
 */
async function encodeMath(
  node: stencila.Math,
  pandocType: 'InlineMath'
): Promise<Pandoc.Math>
async function encodeMath(
  node: stencila.Math,
  pandocType: 'DisplayMath'
): Promise<Pandoc.Para>
async function encodeMath(
  node: stencila.Math,
  pandocType: Pandoc.MathType['t']
): Promise<Pandoc.Math | Pandoc.Para> {
  const { type: nodeType, text, mathLanguage = 'tex' } = node
  if (pandocType === 'InlineMath' && nodeType !== 'MathFragment')
    log.warn(
      `Expected a Stencila "MathFragment" node, but got a got a ${nodeType} node`
    )
  if (pandocType === 'DisplayMath' && nodeType !== 'MathBlock')
    log.warn(
      `Expected a Stencila "MathBlock" node, but got a got a ${nodeType} node`
    )

  const tex = mathLanguage === 'tex' ? text : await texCodec.dump(node)

  const math: Pandoc.Math = {
    t: 'Math',
    c: [{ t: pandocType }, tex],
  }
  if (nodeType === 'MathFragment') return math
  else return { t: 'Para', c: [math] }
}

/**
 * Decode a Pandoc `Link` to a Stencila `Link`.
 */
function decodeLink(node: Pandoc.Link): stencila.Link {
  const [target, title] = node.c[2]
  return stencila.link({
    meta: decodeAttrs(node.c[0]),
    target,
    title: title !== '' ? title : undefined,
    content: decodeInlines(node.c[1]),
  })
}

/**
 * Encode a Stencila `Link` to a Pandoc `Link`.
 */
function encodeLink(node: stencila.Link): Pandoc.Link {
  const [url, title] = [node.target, node.title ?? '']
  return {
    t: 'Link',
    c: [emptyAttrs, encodeInlines(node.content), [url, title]],
  }
}

/**
 * Decode a Pandoc `Cite` to a Stencila `Cite` or `CiteGroup`.
 *
 * A Pandoc `Cite` is a collection of `Citations`. If there
 * is only one `Citation` then create a Stencila `Cite`,
 * otherwise, create a `CiteGroup` (with the first `Cite`
 * having the inline content)
 */
function decodeCite(cite: Pandoc.Cite): stencila.Cite | stencila.CiteGroup {
  const citations = cite.c[0]

  const cites = citations.map((citation) => {
    const { citationId, citationMode, citationPrefix, citationSuffix } =
      citation
    return stencila.cite({
      target: citationId,
      citationMode:
        citationMode.t === 'AuthorInText'
          ? 'Narrative'
          : citationMode.t === 'SuppressAuthor'
          ? 'NarrativeYear'
          : undefined, // `citationMode` defaults to parenthetical if undefined
      citationPrefix:
        citationPrefix.length > 0
          ? decodeInlinesToString(citationPrefix)
          : undefined,
      citationSuffix:
        citationSuffix.length > 0
          ? decodeInlinesToString(citationSuffix)
          : undefined,
    })
  })

  return cites.length === 1 ? cites[0] : stencila.citeGroup({ items: cites })
}

/**
 * Encode a Stencila `Cite` to a Pandoc `Citation`.
 */
function encodeCitation(cite: stencila.Cite): Pandoc.Citation {
  const { target = '', citationMode } = cite
  return {
    citationId: target,
    citationPrefix: [],
    citationSuffix: [],
    citationMode: {
      t:
        citationMode === 'Narrative' || citationMode === 'NarrativeAuthor'
          ? 'AuthorInText'
          : citationMode === 'NarrativeYear'
          ? 'SuppressAuthor'
          : 'NormalCitation',
    },
    citationNoteNum: 0,
    citationHash: 0,
  }
}

/**
 * Encode a Stencila `Cite` to a Pandoc `Cite`.
 */
function encodeCite(cite: stencila.Cite): Pandoc.Cite {
  const { content = [] } = cite
  return {
    t: 'Cite',
    c: [[encodeCitation(cite)], encodeInlines(content)],
  }
}

/**
 * Encode a Stencila `CiteGroup` to a Pandoc `Cite`.
 *
 * This aggregates all the inlines from each Stencila `Cite` into
 * the Pandoc `Cite`'s second argument.
 */
function encodeCiteGroup(citeGroup: stencila.CiteGroup): Pandoc.Cite {
  const { items = [] } = citeGroup
  const citations = items.map(encodeCitation)
  const inlines = items
    .map((item) => item.content)
    .reduce(
      (prev: stencila.InlineContent[], curr) => [
        ...prev,
        ...(curr !== undefined ? curr : []),
      ],
      []
    )
  return {
    t: 'Cite',
    c: [citations, encodeInlines(inlines)],
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
    text: alt,
  }
}

/**
 * Encode a Stencila `ImageObject` to a Pandoc `Image`.
 */
function encodeImageObject(imageObject: stencila.ImageObject): Pandoc.Image {
  const url = imageObject.contentUrl || ''
  const title = TxtCodec.stringify(imageObject.title ?? '')
  const alt: Pandoc.Inline[] = []
  if (imageObject.text) alt.push(encodeString(imageObject.text))
  return {
    t: 'Image',
    c: [emptyAttrs, alt, [url, title]],
  }
}

/**
 * Encode a Stencila `BlockContent` node as an empty Pandoc `Para`.
 * This is a fallback encoding for block nodes not handled elsewhere.
 */
function encodeFallbackBlock(node: stencila.Node): Pandoc.Para {
  log.warn(
    `Unhandled block node type when encoding: ${stencila.nodeType(node)}`
  )
  return {
    t: 'Para',
    c: [],
  }
}

/**
 * Encode a Stencila `InlineContent` as an empty Pandoc `Str`.
 * This is a fallback encoding for inline nodes
 * not handled elsewhere.
 */
function encodeFallbackInline(node: stencila.Node): Pandoc.Str {
  log.warn(
    `Unhandled inline node type when encoding: ${stencila.nodeType(node)}`
  )
  return { t: 'Str', c: '' }
}

/**
 * Encode a Stencila `Node` as a Pandoc `Image` pointing to a RPNG.
 *
 * There are three places that the JSON of the node can get stored:
 *
 * - nodeInPng: in a PNG metadata chunk
 * - nodeInAlt: in the alt text of the image
 * - nodeInLink: by POSTing to the hub.stenci.la/api/nodes and wrapping a link around the image
 */
async function encodeRpng(
  node: stencila.Node,
  settings: EncodeSettings
): Promise<Pandoc.Image | Pandoc.Link> {
  const { nodeInPng = true, nodeInAlt = false, nodeInLink = false } = settings

  const imagePath = tempy.file({ extension: 'png' })
  await (nodeInPng ? rpngCodec : pngCodec).write(node, imagePath)

  let altText: Pandoc.Inline[] = []
  if (nodeInAlt) {
    // Don't include code chunk outputs in alt text for
    // size reasons e.g. images
    let json: string
    if (stencila.isA('CodeChunk', node)) {
      const { outputs, ...rest } = node
      json = JSON.stringify(rest)
    } else {
      json = JSON.stringify(node)
    }
    altText = [{ t: 'Str', c: json }]
  }

  const imgElem: Pandoc.Image = {
    t: 'Image',
    c: [emptyAttrs, altText, [imagePath, nodeType(node)]],
  }

  if (!nodeInLink) return imgElem

  const json = JSON.stringify({
    app: 'Encoda',
    node,
  })
  const { url: linkUrl } = (await http.client
    .post('https://hub.stenci.la/api/nodes', {
      headers: {
        Authorization: `Token ${process.env.STENCILA_API_TOKEN}`,
      },
      body: json,
    })
    .json()) as { url: string }

  return {
    t: 'Link',
    c: [emptyAttrs, [imgElem], [linkUrl, nodeType(node)]],
  }
}

/**
 * Empty Pandoc element attributes
 */
export const emptyAttrs: Pandoc.Attr = ['', [], []]

interface Attributes {
  id?: string
  classes?: string
  [key: string]: string | undefined
}

/**
 * Decode Pandoc `Attr` attributes to an object
 */
function decodeAttrs(
  node: Pandoc.Attr,
  renames: Record<string, string> = {}
): Attributes | undefined {
  const attrs: Attributes = {}
  if (node[0]) attrs.id = node[0]
  if (node[1]?.length) attrs.classes = node[1].join(' ')
  for (const item of node[2]) {
    const [name, value] = item
    const newName = name in renames ? renames[name] : name
    attrs[newName] = value
  }
  return Object.keys(attrs).length > 0 ? attrs : undefined
}

/**
 * Encode an object of attributes to a Pandoc `Attr`.
 */
function encodeAttrs(attrs: Attributes = {}): Pandoc.Attr {
  const { id, classes, ...rest } = attrs
  return [
    id ?? '',
    classes ? classes.split(' ') : [],
    Object.entries(rest).reduce(
      (prev: [string, string][], [name, value]) =>
        value !== undefined ? [...prev, [name, value]] : prev,
      []
    ),
  ]
}

/**
 * `Array.map` but for `objects`.
 *
 * If the result of the function call is undefined then
 * does not insert the entry.
 */
function objectMap(
  obj: object,
  func: (key: string, value: any) => any
): { [key: string]: any } {
  return Object.assign(
    {},
    ...Object.entries(obj).map(([k, v]) => {
      const result = func(k, v)
      return result !== undefined ? { [k]: result } : {}
    })
  )
}
