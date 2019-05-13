import * as stencila from '@stencila/schema'
import childProcess from 'child_process'
import { pandocDataDir, pandocPath } from './boot'
import * as Pandoc from './pandoc-types'
import { create, dump, load, VFile } from './vfile'

export { InputFormat, OutputFormat } from './pandoc-types'

// Although this compiler is usually used as a base for others (e.g `docx`),
// the following definitions allow Pandoc JSON to be parsed or unparsed
// directly
export const mediaTypes = ['application/pandoc+json']
export const extNames = ['pandoc']

/**
 * Parse a `VFile` to a `stencila.Node`.
 *
 * @param file The `VFile` to parse
 * @returns A promise that resolves to a `stencila.Node`
 */
export async function parse(
  file: VFile,
  from: Pandoc.InputFormat = Pandoc.InputFormat.json,
  options: string[] = []
): Promise<stencila.Node> {
  const args = [`--from=${from}`, `--to=json`].concat(options)
  let content = dump(file)
  if (!content) {
    args.push(`${file.path}`)
  }
  const json = await run(content, args)
  const pdoc = JSON.parse(json)
  return parseDocument(pdoc)
}

/**
 * Unparse a `stencila.Node` to a `VFile`.
 *
 * @param node The `stencila.Node` to unparse
 * @param options Additional arguments to pass to Pandoc
 * @param ensureFile Ensure that the output is a real file (ie. not stdout?)
 * @returns A promise that resolves to a `VFile`
 */
export async function unparse(
  node: stencila.Node,
  filePath?: string,
  to: Pandoc.OutputFormat = Pandoc.OutputFormat.json,
  options: string[] = [],
  ensureFile: boolean = false
): Promise<VFile> {
  const type = stencila.type(node)
  if (type !== 'Article') {
    throw new Error(`Unable to unparse Stencila type ${type}`)
  }
  const pdoc = unparseArticle(node as stencila.Article)
  const json = JSON.stringify(pdoc)

  const args = [`--from=json`, `--to=${to}`].concat(options)
  if ((filePath && filePath !== '--') || ensureFile) {
    let output
    if (!filePath || filePath === '--') {
      // Create a new file path, which is returned as `vfile.path`
      output = stencila.type(node).toLowerCase() + '.' + to
      filePath = output
    } else output = filePath
    args.push(`--output=${output}`)
  }

  const content = await run(json, args)

  // If content was output, then load that into a vfile,
  // otherwise the vfile, simply has path to the file created
  if (content) return load(content)
  else return create({ path: filePath })
}

/**
 * Run the Pandoc binary
 */
function run(input: string, args: string[]): Promise<string> {
  args.push(`--data-dir=${pandocDataDir}`)
  if (process.env.DEBUG) {
    console.log(`Running ${pandocPath} with args:\n  ${args.join('\n  ')}`)
  }
  return new Promise((resolve, reject) => {
    const child = childProcess.spawn(pandocPath, args)
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
        stderr = `Pandoc error\n  message: ${stderr}  args:\n    ${args.join(
          '\n    '
        )}\n`
        reject(new Error(stderr))
      } else resolve(stdout)
    })
    child.on('error', err => {
      reject(err)
    })
    child.stdin.write(input)
    child.stdin.end()
  })
}

/**
 * Parse a Pandoc `Document` to a Stencila `Article`.
 */
function parseDocument(pdoc: Pandoc.Document): stencila.Article {
  const meta = parseMeta(pdoc.meta)
  // TODO: mutate metadata to conform to schema
  const content = parseBlocks(pdoc.blocks)
  return {
    type: 'Article',
    authors: [],
    ...meta,
    content
  }
}

/**
 * Parse a Stencila `Article` to a Pandoc `Document`.
 */
function unparseArticle(article: stencila.Article): Pandoc.Document {
  const { type, content, ...rest } = article
  const meta = unparseMeta(rest)
  // TODO: wrap nodes as necessary and avoid use of `as`
  const blocks = unparseBlocks(content as stencila.BlockContent[])
  return {
    'pandoc-api-version': Pandoc.Version,
    meta,
    blocks
  }
}

/**
 * Parse a Pandoc `Meta` node to an `object`
 */
export function parseMeta(meta: Pandoc.Meta): { [key: string]: stencila.Node } {
  return objectMap(meta, (key, value) => parseMetaValue(value))
}

/**
 * Unparse an `object` of metadata into a Pandoc `Meta` node
 */
export function unparseMeta(obj: { [key: string]: any }): Pandoc.Meta {
  return objectMap(obj, (key, value) => unparseMetaValue(value))
}

/**
 * Parse a Pandoc `MetaValue` to a Stencila `Node`
 */
function parseMetaValue(value: Pandoc.MetaValue): stencila.Node {
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
      return value.c.map(parseMetaValue)
    case 'MetaMap':
      return objectMap(value.c, (key, value) => parseMetaValue(value))
    case 'MetaInlines':
      return {
        type: 'Paragraph',
        content: parseInlines(value.c)
      }
    case 'MetaBlocks':
      return {
        // TODO: Currently there is no stencila.Division
        // so using QuoteBlock instead
        type: 'QuoteBlock',
        content: parseBlocks(value.c)
      }
  }
}

/**
 * Unparse a Stencila `Node` to a Pandoc `MetaValue`
 *
 * For `null` and `number`, use a YAML "tags" syntax e.g. `!!null`
 * encoded into a Pandoc `MetaString`.
 */
function unparseMetaValue(node: stencila.Node): Pandoc.MetaValue {
  const type = stencila.type(node)
  switch (type) {
    case 'null':
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
        c: (node as any[]).map(unparseMetaValue)
      }
    case 'Paragraph':
      return {
        t: 'MetaInlines',
        c: unparseInlines((node as stencila.Paragraph).content)
      }
    case 'QuoteBlock':
      return {
        t: 'MetaBlocks',
        c: unparseBlocks((node as stencila.QuoteBlock).content)
      }
    // For both plain objects, and object with `type`, create a `MetaMap`
    case 'object':
    default:
      return {
        t: 'MetaMap',
        c: objectMap(node as object, (key, value) => unparseMetaValue(value))
      }
  }
}

/**
 * Parse an array of Pandoc `Block` elements.
 */
function parseBlocks(blocks: Pandoc.Block[]): stencila.BlockContent[] {
  return blocks.map(block => parseBlock(block))
}

/**
 * Unparse an array of Stencila `BlockContent` nodes.
 */
function unparseBlocks(nodes: stencila.BlockContent[]): Pandoc.Block[] {
  return nodes.map(node => unparseBlock(node))
}

/**
 * Parse a Pandoc `Block` element to a Stencila `BlockContent` node.
 */
function parseBlock(block: Pandoc.Block): stencila.BlockContent {
  switch (block.t) {
    case 'Header':
      return parseHeader(block)
    case 'Para':
      return parsePara(block)
    case 'BlockQuote':
      return parseBlockQuote(block)
    case 'CodeBlock':
      return parseCodeBlock(block)
    case 'BulletList':
    case 'OrderedList':
      return parseList(block as Pandoc.OrderedList)
    case 'Table':
      return parseTable(block)
    case 'HorizontalRule':
      return parseHorizontalRule(block)
  }
  throw new Error(`Unhandled Pandoc node type "${block.t}"`)
}

/**
 * Unparse a Stencila `BlockContent` node to a Pandoc `Block` element.
 */
function unparseBlock(block: stencila.BlockContent): Pandoc.Block {
  const type = block.type
  switch (type) {
    case 'Heading':
      return unparseHeading(block as stencila.Heading)
    case 'Paragraph':
      return unparseParagraph(block as stencila.Paragraph)
    case 'QuoteBlock':
      return unparseQuoteBlock(block as stencila.QuoteBlock)
    case 'CodeBlock':
      return unparseCodeBlock(block as stencila.CodeBlock)
    case 'List':
      return unparseList(block as stencila.List)
    case 'Table':
      return unparseTable(block as stencila.Table)
    case 'ThematicBreak':
      return unparseThematicBreak(block as stencila.ThematicBreak)
  }
  throw new Error(`Unhandled Stencila node type "${block.type}"`)
}

/**
 * Parse a Pandoc `Header` to a Stencila `Heading`
 *
 * Note: currently, any header attributes are ignored
 */
function parseHeader(node: Pandoc.Header): stencila.Heading {
  return {
    type: 'Heading',
    depth: node.c[0],
    content: parseInlines(node.c[2])
  }
}

function unparseHeading(node: stencila.Heading): Pandoc.Header {
  return {
    t: 'Header',
    c: [node.depth, emptyAttrs, unparseInlines(node.content)]
  }
}

function parsePara(node: Pandoc.Para): stencila.Paragraph {
  return {
    type: 'Paragraph',
    content: parseInlines(node.c)
  }
}

function unparseParagraph(node: stencila.Paragraph): Pandoc.Para {
  return {
    t: 'Para',
    c: unparseInlines(node.content)
  }
}

/**
 * Parse a Pandoc `BlockQuote` to a Stencila `QuoteBlock`.
 */
function parseBlockQuote(node: Pandoc.BlockQuote): stencila.QuoteBlock {
  return {
    type: 'QuoteBlock',
    content: parseBlocks(node.c)
  }
}

/**
 * Unparse a Stencila `QuoteBlock` to a Pandoc `BlockQuote`.
 */
function unparseQuoteBlock(node: stencila.QuoteBlock): Pandoc.BlockQuote {
  return {
    t: 'BlockQuote',
    c: unparseBlocks(node.content)
  }
}

/**
 * Parse a Pandoc `CodeBlock` to a Stencila `CodeBlock`.
 */
function parseCodeBlock(node: Pandoc.CodeBlock): stencila.CodeBlock {
  return {
    type: 'CodeBlock',
    // TODO: get the language from the attrs
    // attrs: parseAttr(node.c[0]),
    value: node.c[1]
  }
}

/**
 * Unparse a Stencila `CodeBlock` to a Pandoc `CodeBlock`.
 */
function unparseCodeBlock(node: stencila.CodeBlock): Pandoc.CodeBlock {
  // TODO: pass on language
  return {
    t: 'CodeBlock',
    c: [['', [], []], node.value]
  }
}

/**
 * Parse a Pandoc `BulletList` or `OrderedList` to a Stencila `List`.
 */
function parseList(
  node: Pandoc.BulletList | Pandoc.OrderedList
): stencila.List {
  const order = node.t === 'BulletList' ? 'unordered' : 'ascending'
  const blocks: Pandoc.Block[][] = node.t === 'BulletList' ? node.c : node.c[1]
  // TODO: better handling of unwrapping
  const items = blocks.map(blocks => parseBlocks(blocks)[0])
  return {
    type: 'List',
    order,
    items
  }
}

/**
 * Unparse Stencila `List` as a Pandoc `BulletList` or `OrderedList`.
 */
function unparseList(
  node: stencila.List
): Pandoc.BulletList | Pandoc.OrderedList {
  const listAttrs: Pandoc.ListAttributes = [
    1,
    { t: Pandoc.ListNumberStyle.DefaultStyle },
    { t: Pandoc.ListNumberDelim.DefaultDelim }
  ]
  const blocks: Pandoc.Block[][] = node.items.map(node => {
    // TODO: need to wrap inline elements if necessary
    return [unparseBlock(node as stencila.BlockContent)]
  })
  if (node.order === 'ascending') {
    return { t: 'OrderedList', c: [listAttrs, blocks] }
  } else {
    return { t: 'BulletList', c: blocks }
  }
}

/**
 * Parse a Pandoc `Table` to a Stencila `Table`
 *
 * Note: table caption and column widths and alignments
 * are currently ignored.
 */
function parseTable(node: Pandoc.Table): stencila.Table {
  const caption = parseInlines(node.c[0])
  const aligns = node.c[1]
  const widths = node.c[2]
  const head = node.c[3].map(parseBlocks)
  const data = node.c[4].map(row => row.map(parseBlocks))
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
 * Unparse Stencila `Table` to a Pandoc `Table`.
 */
function unparseTable(node: stencila.Table): Pandoc.Table {
  const caption: Pandoc.Inline[] = []
  const aligns: Pandoc.Alignment[] = []
  const widths: number[] = []
  let head: Pandoc.TableCell[] = []
  if (node.rows.length > 0) {
    head = node.rows[0].cells.map(cell => {
      // TODO: currently need to wrap stencila.InlineContent[] to pandoc.Block[][]; this will change
      return [
        unparseParagraph({
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
          unparseParagraph({
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
 * Parse a Pandoc `HorizontalRule` to a Stencila `ThematicBreak`
 */
function parseHorizontalRule(
  node: Pandoc.HorizontalRule
): stencila.ThematicBreak {
  return {
    type: 'ThematicBreak'
  }
}

/**
 * Unparse a Stencila `ThematicBreak` to a Pandoc `HorizontalRule`
 */
function unparseThematicBreak(
  node: stencila.ThematicBreak
): Pandoc.HorizontalRule {
  return {
    t: 'HorizontalRule',
    c: undefined
  }
}

/**
 * Parse an array of Pandoc `Inline` nodes to Stencila `InlineContent` nodes.
 *
 * Merges contiguous `Str` and `Space` elements prior to parsing.
 */
function parseInlines(nodes: Pandoc.Inline[]): stencila.InlineContent[] {
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
      inlines.push(node)
      previous = node
    }
  }
  return inlines.map(parseInline)
}

function unparseInlines(nodes: stencila.InlineContent[]): Pandoc.Inline[] {
  return nodes.map(unparseInline)
}

/**
 * Parse a Pandoc `Inline` node to a Stencila `InlineContent` node
 */
function parseInline(node: Pandoc.Inline): stencila.InlineContent {
  switch (node.t) {
    case 'Space':
      return parseSpace(node)
    case 'Str':
      return parseStr(node)
    case 'Emph':
      return parseEmph(node)
    case 'Strong':
      return parseStrong(node)
    case 'Strikeout':
      return parseStrikeout(node)
    case 'Quoted':
      return parseQuoted(node)
    case 'Code':
      return parseCode(node)
    case 'Link':
      return parseLink(node)
    case 'Image':
      return parseImage(node)
  }
  throw new Error(`Unhandled Pandoc element type "${node.t}"`)
}

function unparseInline(node: stencila.Node): Pandoc.Inline {
  const type = stencila.type(node)
  switch (type) {
    case 'string':
      return unparseStr(node as string)
    case 'Emphasis':
      return unparseEmph(node as stencila.Emphasis)
    case 'Strong':
      return unparseStrong(node as stencila.Strong)
    case 'Delete':
      return unparseDelete(node as stencila.Delete)
    case 'Quote':
      return unparseQuote(node as stencila.Quote)
    case 'Code':
      return unparseCode(node as stencila.Code)
    case 'Link':
      return unparseLink(node as stencila.Link)
    case 'ImageObject':
      return unparseImageObject(node as stencila.ImageObject)
  }
  throw new Error(`Unhandled Stencila node type "${type}"`)
}

/**
 * Parse a Pandoc `Space` to a `string`.
 */
function parseSpace(node: Pandoc.Space): string {
  return ' '
}

/**
 * Parse a Pandoc pace` to a `string`.
 */
function parseStr(node: Pandoc.Str): string {
  return node.c
}

/**
 * Unparse a `string` to a Pandoc `Str`.
 */
function unparseStr(node: string): Pandoc.Str {
  return {
    t: 'Str',
    c: node
  }
}

/**
 * Parse a Pandoc `Emph` to a Stencila `Emphasis`.
 */
function parseEmph(node: Pandoc.Emph): stencila.Emphasis {
  return {
    type: 'Emphasis',
    content: parseInlines(node.c)
  }
}

/**
 * Unparse a Stencila `Emphasis` to a Pandoc `Emph`.
 */
function unparseEmph(node: stencila.Emphasis): Pandoc.Emph {
  return {
    t: 'Emph',
    c: unparseInlines(node.content)
  }
}

/**
 * Parse a Pandoc `Strong` to a Stencila `Strong`.
 */
function parseStrong(node: Pandoc.Strong): stencila.Strong {
  return {
    type: 'Strong',
    content: parseInlines(node.c)
  }
}

/**
 * Unparse a Stencila `Strong` to a Pandoc `Strong`.
 */
function unparseStrong(node: stencila.Strong): Pandoc.Strong {
  return {
    t: 'Strong',
    c: unparseInlines(node.content)
  }
}

/**
 * Parse a Pandoc `Strikeout` to a Stencila `Delete`.
 */
function parseStrikeout(node: Pandoc.Strikeout): stencila.Delete {
  return {
    type: 'Delete',
    content: parseInlines(node.c)
  }
}

/**
 * Unparse a Stencila `Delete` to a Pandoc `Strikeout`.
 */
function unparseDelete(node: stencila.Delete): Pandoc.Strikeout {
  return {
    t: 'Strikeout',
    c: unparseInlines(node.content)
  }
}

/**
 * Parse a Pandoc `Quoted` to a Stencila `Quote`.
 *
 * Note: the type of quote, single or double, is ignored.
 */
function parseQuoted(node: Pandoc.Quoted): stencila.Quote {
  return {
    type: 'Quote',
    content: parseInlines(node.c[1])
  }
}

/**
 * Unparse a Stencila `Quote` to a Pandoc `Quoted`.
 */
function unparseQuote(node: stencila.Quote): Pandoc.Quoted {
  return {
    t: 'Quoted',
    c: [{ t: Pandoc.QuoteType.SingleQuote }, unparseInlines(node.content)]
  }
}

/**
 * Parse a Pandoc `Code` to a Stencila `Code`.
 */
function parseCode(node: Pandoc.Code): stencila.Code {
  // TODO: check how pandoc treats language classes `language-xxx`?
  // TODO: currently taking first class
  const language = node.c[0][1][0] ? node.c[0][1][0] : ''
  return {
    type: 'Code',
    language,
    value: node.c[1]
  }
}

/**
 * Unparse a Stencila `Code` to a Pandoc `Code`.
 */
function unparseCode(node: stencila.Code): Pandoc.Code {
  const clas = `${node.language}`
  return {
    t: 'Code',
    c: [['', [clas], []], node.value]
  }
}

/**
 * Parse a Pandoc `Link` to a Stencila `Link`.
 *
 * Note: attributes are ignored
 */
function parseLink(node: Pandoc.Link): stencila.Link {
  const [url, title] = node.c[2]
  return {
    type: 'Link',
    content: parseInlines(node.c[1]),
    target: url,
    description: title
  }
}

/**
 * Unparse a Stencila `Link` to a Pandoc `Link`.
 */
function unparseLink(node: stencila.Link): Pandoc.Link {
  const [url, title] = [node.target, node.description || '']
  return {
    t: 'Link',
    c: [emptyAttrs, unparseInlines(node.content), [url, title]]
  }
}

/**
 * Parse a Pandoc `Emph` to a Stencila `Emphasis`.
 *
 * Note: attributes are ignored.
 */
function parseImage(node: Pandoc.Image): stencila.ImageObject {
  const alt = parseInlines(node.c[1])
  const [url, title] = node.c[2]
  return {
    type: 'ImageObject',
    // TODO: do we need a specific alt text property in stencila.ImageObject?
    content: alt,
    contentUrl: url,
    caption: title
  }
}

/**
 * Unparse a Stencila `Emphasis` to a Pandoc `Emph`.
 */
function unparseImageObject(node: stencila.ImageObject): Pandoc.Image {
  const [url, title] = [node.contentUrl || '', node.caption || '']
  return {
    t: 'Image',
    c: [
      emptyAttrs,
      unparseInlines(node.content as stencila.InlineContent[]),
      [url, title]
    ]
  }
}

/**
 * Empty Pandoc element attributes
 */
export const emptyAttrs: Pandoc.Attr = ['', [], []]

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
