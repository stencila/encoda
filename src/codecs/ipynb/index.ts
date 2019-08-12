/**
 * @module ipynb
 */

/* eslint-disable @typescript-eslint/camelcase, @typescript-eslint/no-namespace */

import stencila from '@stencila/schema'
import { isEntity, nodeType } from '@stencila/schema/dist/util'
import { dump, load } from '../..'
import * as dataUri from '../../util/dataUri'
import * as vfile from '../../util/vfile'
import { Codec } from '../types'
import * as nbformat3 from './nbformat-v3'
import * as nbformat4 from './nbformat-v4'

/**
 * Additional type definitions not generated from JSON Schemas
 * or required for decoding based on format version.
 */
namespace nbformat {
  /**
   * An enum for the version of notebook being processed.
   * Used for branching logic in decoding functions below.
   */
  export enum Version {
    v3 = 3,
    v4 = 4
  }

  export namespace v3 {
    // Provide missing union type for cell
    export type Cell =
      | nbformat3.RawCell
      | nbformat3.MarkdownCell
      | nbformat3.HeadingCell
      | nbformat3.CodeCell

    /**
     * Types that we need to check for using `isa` typeguard
     */
    export interface Types {
      Notebook: nbformat3.Notebook
      Cell: Cell
      Pyout: nbformat3.Pyout
      DisplayData: nbformat3.DisplayData
    }
  }

  /**
   * A multiline string.
   */
  export type MultilineString = string | string[]

  /**
   * A mime-type keyed dictionary of data.
   *
   * For most MIME types the data is a `MultilineString` but
   * "Mimetypes with JSON output, can be any type" (source: `nbformat-v4.json.schema`)
   */
  export interface MimeBundle {
    [key: string]: MultilineString | any
  }
}

/**
 * Type guard for letting Typescript know that node is a v3 type
 */
export function isv3<Key extends keyof nbformat.v3.Types>(
  node: unknown,
  key: Key,
  version: nbformat.Version
): node is nbformat.v3.Types[Key] {
  return version === nbformat.Version.v3
}

export class IPyNbCodec extends Codec implements Codec {
  /**
   * The media types that this codec can decode/encode.
   */
  public mediaTypes = ['application/x-ipynb+json']

  /**
   * The file extension names associated with this codec.
   */
  public extNames = ['ipynb']

  /**
   * Decode a `VFile` with IPYNB content to a Stencila `Node`.
   *
   * @param file The `VFile` to decode
   * @returns A promise that resolves to a Stencila `Node`
   */
  public decode = async (file: vfile.VFile): Promise<stencila.Node> => {
    const json = await vfile.dump(file)
    const ipynb = JSON.parse(json)
    return decodeNotebook(ipynb, ipynb.nbformat)
  }

  /**
   * Encode a Stencila `Node` to a `VFile` with IPYNB content.
   *
   * @param thing The Stencila `Node` to encode
   * @returns A promise that resolves to a `VFile`
   */
  public encode = async (node: stencila.Node): Promise<vfile.VFile> => {
    const ipynb = await encodeNode(node)
    const json = JSON.stringify(ipynb, null, '  ')
    return vfile.load(json)
  }
}

/**
 * Decode a Jupyter `Notebook` to a Stencila `Article`.
 */
async function decodeNotebook(
  notebook: nbformat3.Notebook | nbformat4.Notebook,
  version: nbformat.Version = 4
): Promise<stencila.Article> {
  // TODO: Extract other metadata?
  let { title, authors, orig_nbformat, ...rest } = notebook.metadata
  if (!title) title = 'Untitled'
  if (!authors) authors = []

  const meta = { orig_nbformat, ...rest }

  const cells = isv3(notebook, 'Notebook', version)
    ? notebook.worksheets[0].cells
    : notebook.cells

  const content = await decodeCells(cells, version)

  return {
    type: 'Article',
    title,
    authors,
    meta,
    content
  }
}

/**
 * Encode a Stencila `Article` as a Jupyter `Notebook`.
 */
async function encodeNode(node: stencila.Node): Promise<nbformat4.Notebook> {
  // TODO: Wrap non-articles into an Article
  const article = node as stencila.Article
  const { title, authors, meta, content } = article

  const metadata = {
    ...meta,
    title,
    authors
  }

  const cells = await encodeCells(content || [])

  return {
    nbformat: 4,
    nbformat_minor: 4,
    metadata,
    cells
  }
}

/**
 * Decode an array of Jupyter `Cells` to and array of Stencila `BlockContent` nodes.
 */
async function decodeCells(
  cells: (nbformat.v3.Cell | nbformat4.Cell)[],
  version: nbformat.Version = 4
): Promise<stencila.BlockContent[]> {
  const blocks: stencila.BlockContent[] = []
  for (const cell of cells) {
    switch (cell.cell_type) {
      case 'markdown':
        blocks.push(...(await decodeMarkdownCell(cell, version)))
        break
      case 'code':
        blocks.push(await decodeCodeCell(cell, version))
        break
      case 'raw':
        // TODO: handle `raw` cells
        break
      default:
        // The above should handle all cell types but in case of an invalid
        // type, instead of throwing an error, return cell as a JSON code block of cell
        blocks.push({
          type: 'CodeBlock',
          language: 'json',
          value: JSON.stringify(cell)
        })
    }
  }
  return blocks
}

/**
 * Encode an array of Stencila `Node`s as an array of Jupyter `Cells`.
 */
async function encodeCells(nodes: stencila.Node[]): Promise<nbformat4.Cell[]> {
  let content: stencila.Node[] = []
  const cells: nbformat4.Cell[] = []
  for (const node of nodes) {
    switch (nodeType(node)) {
      case 'CodeChunk':
        if (content.length) {
          cells.push(await encodeMarkdownCell(content))
          content = []
        }
        cells.push(await encodeCodeChunk(node as stencila.CodeChunk))
        break
      default:
        content.push(node)
    }
  }
  if (content.length) cells.push(await encodeMarkdownCell(content))
  return cells
}

/**
 * Decode a Jupyter `MarkdownCell` as an array of Stencila `BlockContent` nodes.
 */
async function decodeMarkdownCell(
  cell: nbformat3.MarkdownCell | nbformat4.MarkdownCell,
  version: nbformat.Version = 4
): Promise<stencila.BlockContent[]> {
  // TODO: handle metadata
  const { metadata, source } = cell
  const markdown = decodeMultilineString(source)
  const node = await load(markdown, 'md')
  // TODO: avoid this type casting
  const article = node as stencila.Article
  return article.content as stencila.BlockContent[]
}

/**
 * Encode an array of Stencila `Node`s as a Jupyter `MarkdownCell`
 */
async function encodeMarkdownCell(
  nodes: stencila.Node[]
): Promise<nbformat4.MarkdownCell> {
  // TODO: consider a md function that will return
  // a fragment, not a whole article
  const article = {
    type: 'Article',
    content: nodes
  }

  const metadata = {}

  const markdown = await dump(article, 'md')
  const source = encodeMultilineString(markdown.trim())

  return {
    cell_type: 'markdown',
    metadata,
    source
  }
}

/**
 * Decode a Jupyter `CodeCell` to a Stencila `CodeChunk`.
 */
async function decodeCodeCell(
  cell: nbformat3.CodeCell | nbformat4.CodeCell,
  version: nbformat.Version = 4
): Promise<stencila.CodeChunk> {
  const { metadata, outputs } = cell

  const [execution_count, source] = isv3(cell, 'Cell', version)
    ? [cell.prompt_number, cell.input]
    : [cell.execution_count, cell.source]

  const codeChunk: stencila.CodeChunk = {
    type: 'CodeChunk',
    meta: { ...metadata, execution_count },
    text: decodeMultilineString(source)
  }

  if (outputs && outputs.length)
    codeChunk.outputs = await decodeOutputs(outputs, version)

  return codeChunk
}

/**
 * Encode a Stencila `CodeChunk` as a Jupyter `CodeCell`.
 */
async function encodeCodeChunk(
  chunk: stencila.CodeChunk
): Promise<nbformat4.CodeCell> {
  const metadata = {}
  const execution_count = (chunk.meta && chunk.meta.execution_count) || 1
  const source = encodeMultilineString(chunk.text || '')
  const outputs: nbformat4.Output[] = await encodeOutputs(
    chunk,
    chunk.outputs || []
  )
  return {
    cell_type: 'code',
    metadata,
    execution_count,
    source,
    outputs
  }
}

/**
 * Decode the `outputs` of a Jupyter `CodeCell` to an array of Stencila `Node`s.
 */
async function decodeOutputs(
  outputs: (nbformat3.Output | nbformat4.Output)[],
  version: nbformat.Version = 4
): Promise<stencila.Node[]> {
  const nodes = await Promise.all(
    outputs.map(output => decodeOutput(output, version))
  )

  // Remove any matplotlib plot string representations when there is also
  // an image output (ie the actual plot). See https://github.com/stencila/encoda/issues/146
  if (
    nodes.filter(node => isEntity(node) && node.type === 'ImageObject').length >
    0
  ) {
    return nodes.filter(
      node => !(typeof node === 'string' && /^\[?<matplotlib\./.test(node))
    )
  }

  return nodes
}

async function decodeOutput(
  output: nbformat3.Output | nbformat4.Output,
  version: nbformat.Version = 4
): Promise<stencila.Node> {
  switch (output.output_type) {
    case 'execute_result':
    case 'pyout':
      if (isv3(output, 'Pyout', version)) {
        // Remove the 'non-data' properties from the `Pyout`
        const { output_type, prompt_number, metadata, ...data } = output
        return decodeMimeBundle(data, version)
      } else {
        return decodeMimeBundle(output.data, version)
      }
    case 'display_data':
      if (isv3(output, 'DisplayData', version)) {
        // Remove the 'non-data' properties from the `DisplayData`
        const { output_type, metadata, ...data } = output
        return decodeMimeBundle(data, version)
      } else {
        return decodeMimeBundle(output.data, version)
      }
    case 'stream':
      return decodeMultilineString(output.text)
    case 'error':
    case 'pyerr':
      // TODO: decode error
      return ''
    default:
      // The above should handle all output types but in case of an invalid
      // type, instead of throwing an error, return a JSON code block of output
      return {
        type: 'CodeBlock',
        language: 'json',
        value: JSON.stringify(output)
      }
  }
}

/**
 * Encode the `outputs` of a Stencila `CodeChunk` to an array of Jupyter `Output`s.
 *
 * Note that the Stenila document model does not differentiate among different sources
 * of outputs e.g. `stdout` from a `print` statement versus a `string` from a `execute_result`.
 * So, we don't try to revert to the source that may have been in the `ipynb` originally.
 * Instead, we use the convention of encoding `string`s as `Stream` outputs.
 */
async function encodeOutputs(
  chunk: stencila.CodeChunk,
  nodes: stencila.Node[]
): Promise<nbformat4.Output[]> {
  return Promise.all(
    nodes.map(async node => {
      switch (nodeType(node)) {
        case 'string':
          return encodeStream(chunk, node)
        case 'ImageObject':
          return encodeDisplayData(chunk, node)
        default:
          return encodeExecuteResult(chunk, node)
      }
    })
  )
}

/**
 * Encode a `string` that is a `CodeChunk` `output` as a Jupyter `Stream`.
 */
async function encodeStream(
  chunk: stencila.CodeChunk,
  node: stencila.Node
): Promise<nbformat4.Stream> {
  return {
    output_type: 'stream',
    name: 'stdout',
    text: node as string
  }
}

/**
 * Encode a Stencila `Node` that is a `CodeChunk` `output` as a Jupyter `DisplayData`.
 */
async function encodeDisplayData(
  chunk: stencila.CodeChunk,
  node: stencila.Node
): Promise<nbformat4.DisplayData> {
  return {
    output_type: 'display_data',
    metadata: {},
    data: await encodeMimeBundle(node)
  }
}

/**
 * Encode a Stencila `Node` that is a `CodeChunk` `output` as a Jupyter `ExecuteResult`.
 */
async function encodeExecuteResult(
  chunk: stencila.CodeChunk,
  node: stencila.Node
): Promise<nbformat4.ExecuteResult> {
  const execution_count = (chunk.meta && chunk.meta.execution_count) || 1
  return {
    output_type: 'execute_result',
    execution_count,
    metadata: {},
    data: await encodeMimeBundle(node)
  }
}

/**
 * Decode a Jupyter `MimeBundle` to a Stencila `Node`.
 *
 * The bundle is a dictionary of {mediaType : content}. We iterate over
 * the dictionary until we find the first media type that can be decoded.
 */
async function decodeMimeBundle(
  bundle: nbformat.MimeBundle,
  version: nbformat.Version = 4
): Promise<stencila.Node> {
  for (const [key, data] of Object.entries(bundle)) {
    // For nbformat 3 it is necessary to convert some property
    // names to mimetypes
    const map: { [key: string]: string } = {
      html: 'text/html',
      javascript: 'application/javascript',
      jpeg: 'image/jpeg',
      json: 'application/json',
      latex: 'application/x-latex',
      pdf: 'application/pdf',
      png: 'image/png',
      svg: 'image/svg+xml',
      text: 'text/plain'
    }
    const mimetype = version === 3 ? map[key] || key : key

    const content =
      typeof data === 'string'
        ? data
        : Array.isArray(data)
        ? data.join('')
        : data.toString()

    if (['image/png', 'image/jpeg'].includes(mimetype)) {
      const dataUrl = `data:${mimetype};base64,${content}`
      const { mediaType: format, filePath: contentUrl } = await dataUri.toFile(
        dataUrl
      )
      return {
        type: 'ImageObject',
        format,
        contentUrl
      }
    } else {
      // TODO: handle other mime types e.g. application/x+json
      return load(content, mimetype)
    }
  }
  // TODO: handling of fallback
  return ''
}

/**
 * Encode a Stencila `Node` as a Jupyter `MimeBundle`.
 *
 * The MIME type (aka media type) of the bundle is determined
 * by the type of `Node`.
 */
async function encodeMimeBundle(
  node: stencila.Node
): Promise<nbformat.MimeBundle> {
  const [mediaType, data] = await (async (): Promise<[string, string]> => {
    switch (nodeType(node)) {
      case 'string':
        return ['text/plain', await dump(node, 'text')]
      case 'ImageObject':
        const image = node as stencila.ImageObject
        const { mediaType, dataUri: dataUrl } = await dataUri.fromFile(
          image.contentUrl
        )
        const data = dataUrl.split('base64,').pop() || ''
        return [mediaType, data]
    }
    return ['text/html', await dump(node, 'html')]
  })()

  const bundle: nbformat.MimeBundle = {}
  bundle[mediaType] = encodeMultilineString(data)
  return bundle
}

/**
 * Decode a Jupyter `MultilineString` to a `string`.
 */
export function decodeMultilineString(
  source: nbformat.MultilineString
): string {
  return Array.isArray(source) ? source.join('') : source
}

/**
 * Encode a `string` as a Jupyter `MultilineString`.
 */
export function encodeMultilineString(
  source: string
): nbformat.MultilineString {
  const lines = source.split('\n')
  return lines
    .slice(0, -1)
    .map(line => line + '\n')
    .concat(lines.slice(-1))
}
