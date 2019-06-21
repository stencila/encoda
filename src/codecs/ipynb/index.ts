/**
 * # IPYNB codec
 *
 * This module is still in development. In particular more work needs to be
 * done on type safety and better ways to support nbformat versions 3 and 4.
 *
 * @module ipynb
 */

/** A comment required for above to be included in docs.
 * See https://github.com/christopherthielen/typedoc-plugin-external-module-name/issues/300
 */

import stencila from '@stencila/schema'
import { dump, Encode, load } from '../..'
import * as dataUri from '../../util/dataUri'
import type from '../../util/type'
import * as vfile from '../../util/vfile'

/**
 * The media types that this codec can decode/encode.
 */
export const mediaTypes = ['application/x-ipynb+json']

/**
 * The file extension names associated with this codec.
 */
export const extNames = ['ipynb']

/**
 * Decode a `VFile` with IPYNB content to a Stencila `Node`.
 *
 * @param file The `VFile` to decode
 * @returns A promise that resolves to a Stencila `Node`
 */
export async function decode(file: vfile.VFile): Promise<stencila.Node> {
  const json = await vfile.dump(file)
  const ipynb: nbformat.INotebookContent = JSON.parse(json)
  return decodeNotebook(ipynb)
}

/**
 * Encode a Stencila `Node` to a `VFile` with IPYNB content.
 *
 * @param thing The Stencila `Node` to encode
 * @returns A promise that resolves to a `VFile`
 */
export const encode: Encode = async (
  node: stencila.Node
): Promise<vfile.VFile> => {
  const ipynb = await encodeNode(node)
  const json = JSON.stringify(ipynb, null, '  ')
  return vfile.load(json)
}

/**
 * Decode a Jupyter `Notebook` to a Stencila `Article`.
 */
async function decodeNotebook(
  notebook: nbformat.INotebookContent
): Promise<stencila.Article> {
  // TODO: Extract other metadata?
  let { title, authors, orig_nbformat, ...rest } = notebook.metadata
  if (!title) title = 'Untitled'
  if (!authors) authors = []

  const meta = { orig_nbformat, ...rest }

  let cells = notebook.cells
  if (!cells) {
    // For `nbformat` <=3 cells were in a worksheet
    // @ts-ignore
    cells = notebook.worksheets[0].cells
  }
  if (!cells)
    throw new Error('Unable to get cells. Is this a Jupyter Notebook?')

  const content = await decodeCells(cells)

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
async function encodeNode(
  node: stencila.Node
): Promise<nbformat.INotebookContent> {
  // TODO: Wrap non-articles into an Article
  const article = node as stencila.Article
  const { title, authors, meta, content } = article

  const metadata = {
    orig_nbformat: 1, //
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
  cells: nbformat.ICell[]
): Promise<stencila.BlockContent[]> {
  const blocks: stencila.BlockContent[] = []
  for (const cell of cells) {
    switch (cell.cell_type) {
      case 'markdown':
        blocks.push(
          ...(await decodeMarkdownCell(cell as nbformat.IMarkdownCell))
        )
        break
      case 'code':
        blocks.push(await decodeCodeCell(cell as nbformat.ICodeCell))
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
async function encodeCells(nodes: stencila.Node[]): Promise<nbformat.ICell[]> {
  let content: stencila.Node[] = []
  const cells: nbformat.ICell[] = []
  for (const node of nodes) {
    switch (type(node)) {
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
  cell: nbformat.IMarkdownCell
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
): Promise<nbformat.IMarkdownCell> {
  // TODO: consider a md function that will return
  // a fragment, not a whole article
  const article = {
    type: 'Article',
    content: nodes
  }

  const metadata = {}

  const markdown = await dump(article, { format: 'md' })
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
  cell: nbformat.ICodeCell
): Promise<stencila.CodeChunk> {
  let { metadata, outputs, execution_count } = cell

  // In nbformat 3, it's `prompt_number` not `execution_count`
  if (!execution_count && cell.prompt_number) {
    execution_count = cell.prompt_number
  }

  const meta = { ...metadata, execution_count }

  // nbformat 4 has `source`, 3 has `input`
  const source = cell.source ? cell.source : cell.input
  const code = decodeMultilineString(source)

  const codeChunk: stencila.CodeChunk = {
    type: 'CodeChunk',
    meta,
    text: code
  }

  if (outputs && outputs.length)
    codeChunk.outputs = await decodeOutputs(outputs)

  return codeChunk
}

/**
 * Encode a Stencila `CodeChunk` as a Jupyter `CodeCell`.
 */
async function encodeCodeChunk(
  chunk: stencila.CodeChunk
): Promise<nbformat.ICodeCell> {
  const metadata = {}
  const execution_count = (chunk.meta && chunk.meta.execution_count) || 1
  const source = encodeMultilineString(chunk.text || '')
  const outputs: nbformat.IOutput[] = await encodeOutputs(
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
  outputs: nbformat.IOutput[]
): Promise<stencila.Node[]> {
  return Promise.all(
    outputs.map(async output => {
      switch (output.output_type) {
        case 'execute_result':
        case 'display_data':
        case 'update_display_data':
        case 'pyout': // nbformat 3
          let data = output.data
          // nbformat 3: there is no separate data dictionary and
          // the output is `IMimeBundle` like (but with format name, not MIME types)
          if (!data) {
            const { output_type, prompt_number, ...rest } = output
            data = rest
          }
          return await decodeMimeBundle(data as nbformat.IMimeBundle)
        case 'stream':
          return await decodeMultilineString(
            output.text as nbformat.MultilineString
          )
        case 'error':
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
    })
  )
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
): Promise<nbformat.IOutput[]> {
  return Promise.all(
    nodes.map(async node => {
      switch (type(node)) {
        case 'string':
          return await encodeStream(chunk, node)
        case 'ImageObject':
          return await encodeDisplayData(chunk, node)
        default:
          return await encodeExecuteResult(chunk, node)
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
): Promise<nbformat.IStream> {
  return {
    output_type: 'stream',
    metadata: {},
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
): Promise<nbformat.IDisplayData> {
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
): Promise<nbformat.IExecuteResult> {
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
  bundle: nbformat.IMimeBundle
): Promise<stencila.Node> {
  for (const [mimetype, data] of Object.entries(bundle)) {
    const content =
      typeof data === 'string'
        ? data
        : Array.isArray(data)
        ? data.join('')
        : data.toString()

    if (['image/png', 'png', 'image/jpeg', 'jpeg'].includes(mimetype)) {
      const mediaType = mimetype.startsWith('image/')
        ? mimetype
        : 'image/' + mimetype
      const dataUrl = `data:${mediaType};base64,${content}`
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
      return await load(content, mimetype)
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
): Promise<nbformat.IMimeBundle> {
  let [mediaType, data] = await (async (): Promise<[string, string]> => {
    switch (type(node)) {
      case 'string':
        return ['text/plain', await dump(node, { format: 'text' })]
      case 'ImageObject':
        const image = node as stencila.ImageObject
        const { mediaType, dataUri: dataUrl } = await dataUri.fromFile(
          image.contentUrl
        )
        const data = dataUrl.split('base64,').pop() || ''
        return [mediaType, data]
    }
    return ['text/html', await dump(node, { format: 'html' })]
  })()

  const bundle: nbformat.IMimeBundle = {}
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

/**
 * The following type definitions have been vendored in from
 * `@jupyterlab/coreutils` because the current version fails to build.
 * Here the `JSONObject` is defined to fix those issues.
 *
 * import { nbformat } from '@jupyterlab/coreutils';
 */

type JSONObject = { [key: string]: any }

/**
 * A namespace for nbformat interfaces.
 */
export declare namespace nbformat {
  /**
   * The major version of the notebook format.
   */
  const MAJOR_VERSION: number
  /**
   * The minor version of the notebook format.
   */
  const MINOR_VERSION: number
  /**
   * The kernelspec metadata.
   */
  interface IKernelspecMetadata extends JSONObject {
    name: string
    display_name: string
  }
  /**
   * The language info metatda
   */
  interface ILanguageInfoMetadata extends JSONObject {
    name: string
    codemirror_mode?: string | JSONObject
    file_extension?: string
    mimetype?: string
    pygments_lexer?: string
  }
  /**
   * The default metadata for the notebook.
   */
  interface INotebookMetadata extends JSONObject {
    kernelspec?: IKernelspecMetadata
    language_info?: ILanguageInfoMetadata
    orig_nbformat: number
  }
  /**
   * The notebook content.
   */
  interface INotebookContent extends JSONObject {
    metadata: INotebookMetadata
    nbformat_minor: number
    nbformat: number
    cells: ICell[]
  }
  /**
   * A multiline string.
   */
  type MultilineString = string | string[]
  /**
   * A mime-type keyed dictionary of data.
   */
  interface IMimeBundle extends JSONObject {
    [key: string]: MultilineString | JSONObject
  }
  /**
   * Media attachments (e.g. inline images).
   */
  interface IAttachments {
    [key: string]: IMimeBundle
  }
  /**
   * The code cell's prompt number. Will be null if the cell has not been run.
   */
  type ExecutionCount = number | null
  /**
   * Cell output metadata.
   */
  type OutputMetadata = JSONObject
  /**
   * Validate a mime type/value pair.
   *
   * @param type - The mimetype name.
   *
   * @param value - The value associated with the type.
   *
   * @returns Whether the type/value pair are valid.
   */
  function validateMimeValue(
    type: string,
    value: MultilineString | JSONObject
  ): boolean
  /**
   * A type which describes the type of cell.
   */
  type CellType = 'code' | 'markdown' | 'raw'
  /**
   * The Jupyter metadata namespace.
   */
  interface IBaseCellJupyterMetadata extends JSONObject {
    /**
     * Whether the source is hidden.
     */
    source_hidden: boolean
  }
  /**
   * Cell-level metadata.
   */
  interface IBaseCellMetadata extends JSONObject {
    /**
     * Whether the cell is trusted.
     *
     * #### Notes
     * This is not strictly part of the nbformat spec, but it is added by
     * the contents manager.
     *
     * See https://jupyter-notebook.readthedocs.io/en/latest/security.html.
     */
    trusted: boolean
    /**
     * The cell's name. If present, must be a non-empty string.
     */
    name: string
    /**
     * The Jupyter metadata namespace
     */
    jupyter: Partial<IBaseCellJupyterMetadata>
    /**
     * The cell's tags. Tags must be unique, and must not contain commas.
     */
    tags: string[]
  }
  /**
   * The base cell interface.
   */
  interface IBaseCell extends JSONObject {
    /**
     * String identifying the type of cell.
     */
    cell_type: string
    /**
     * Contents of the cell, represented as an array of lines.
     */
    source: MultilineString
    /**
     * Cell-level metadata.
     */
    metadata: Partial<ICellMetadata>
  }
  /**
   * Metadata for the raw cell.
   */
  interface IRawCellMetadata extends IBaseCellMetadata {
    /**
     * Raw cell metadata format for nbconvert.
     */
    format: string
  }
  /**
   * A raw cell.
   */
  interface IRawCell extends IBaseCell {
    /**
     * String identifying the type of cell.
     */
    cell_type: 'raw'
    /**
     * Cell-level metadata.
     */
    metadata: Partial<IRawCellMetadata>
    /**
     * Cell attachments.
     */
    attachments?: IAttachments
  }
  /**
   * A markdown cell.
   */
  interface IMarkdownCell extends IBaseCell {
    /**
     * String identifying the type of cell.
     */
    cell_type: 'markdown'
    /**
     * Cell attachments.
     */
    attachments?: IAttachments
  }
  /**
   * The Jupyter metadata namespace for code cells.
   */
  interface ICodeCellJupyterMetadata extends IBaseCellJupyterMetadata {
    /**
     * Whether the outputs are hidden. See https://github.com/jupyter/nbformat/issues/137.
     */
    outputs_hidden: boolean
  }
  /**
   * Metadata for a code cell.
   */
  interface ICodeCellMetadata extends IBaseCellMetadata {
    /**
     * Whether the cell is collapsed/expanded.
     */
    collapsed: boolean
    /**
     * The Jupyter metadata namespace
     */
    jupyter: Partial<ICodeCellJupyterMetadata>
    /**
     * Whether the cell's output is scrolled, unscrolled, or autoscrolled.
     */
    scrolled: boolean | 'auto'
  }
  /**
   * A code cell.
   */
  interface ICodeCell extends IBaseCell {
    /**
     * String identifying the type of cell.
     */
    cell_type: 'code'
    /**
     * Cell-level metadata.
     */
    metadata: Partial<ICodeCellMetadata>
    /**
     * Execution, display, or stream outputs.
     */
    outputs: IOutput[]
    /**
     * The code cell's prompt number. Will be null if the cell has not been run.
     */
    execution_count: ExecutionCount
  }
  /**
   * An unrecognized cell.
   */
  interface IUnrecognizedCell extends IBaseCell {}
  /**
   * A cell union type.
   */
  type ICell = IRawCell | IMarkdownCell | ICodeCell | IUnrecognizedCell
  /**
   * Test whether a cell is a raw cell.
   */
  function isRaw(cell: ICell): cell is IRawCell
  /**
   * Test whether a cell is a markdown cell.
   */
  function isMarkdown(cell: ICell): cell is IMarkdownCell
  /**
   * Test whether a cell is a code cell.
   */
  function isCode(cell: ICell): cell is ICodeCell
  /**
   * A union metadata type.
   */
  type ICellMetadata = IBaseCellMetadata | IRawCellMetadata | ICodeCellMetadata
  /**
   * The valid output types.
   */
  type OutputType =
    | 'execute_result'
    | 'display_data'
    | 'stream'
    | 'error'
    | 'update_display_data'
  /**
   * The base output type.
   */
  interface IBaseOutput extends JSONObject {
    /**
     * Type of cell output.
     */
    output_type: string
  }
  /**
   * Result of executing a code cell.
   */
  interface IExecuteResult extends IBaseOutput {
    /**
     * Type of cell output.
     */
    output_type: 'execute_result'
    /**
     * A result's prompt number.
     */
    execution_count: ExecutionCount
    /**
     * A mime-type keyed dictionary of data.
     */
    data: IMimeBundle
    /**
     * Cell output metadata.
     */
    metadata: OutputMetadata
  }
  /**
   * Data displayed as a result of code cell execution.
   */
  interface IDisplayData extends IBaseOutput {
    /**
     * Type of cell output.
     */
    output_type: 'display_data'
    /**
     * A mime-type keyed dictionary of data.
     */
    data: IMimeBundle
    /**
     * Cell output metadata.
     */
    metadata: OutputMetadata
  }
  /**
   * Data displayed as an update to existing display data.
   */
  interface IDisplayUpdate extends IBaseOutput {
    /**
     * Type of cell output.
     */
    output_type: 'update_display_data'
    /**
     * A mime-type keyed dictionary of data.
     */
    data: IMimeBundle
    /**
     * Cell output metadata.
     */
    metadata: OutputMetadata
  }
  /**
   * Stream output from a code cell.
   */
  interface IStream extends IBaseOutput {
    /**
     * Type of cell output.
     */
    output_type: 'stream'
    /**
     * The name of the stream.
     */
    name: StreamType
    /**
     * The stream's text output.
     */
    text: MultilineString
  }
  /**
   * An alias for a stream type.
   */
  type StreamType = 'stdout' | 'stderr'
  /**
   * Output of an error that occurred during code cell execution.
   */
  interface IError extends IBaseOutput {
    /**
     * Type of cell output.
     */
    output_type: 'error'
    /**
     * The name of the error.
     */
    ename: string
    /**
     * The value, or message, of the error.
     */
    evalue: string
    /**
     * The error's traceback.
     */
    traceback: string[]
  }
  /**
   * Unrecognized output.
   */
  interface IUnrecognizedOutput extends IBaseOutput {}
  /**
   * Test whether an output is an execute result.
   */
  function isExecuteResult(output: IOutput): output is IExecuteResult
  /**
   * Test whether an output is from display data.
   */
  function isDisplayData(output: IOutput): output is IDisplayData
  /**
   * Test whether an output is from updated display data.
   */
  function isDisplayUpdate(output: IOutput): output is IDisplayUpdate
  /**
   * Test whether an output is from a stream.
   */
  function isStream(output: IOutput): output is IStream
  /**
   * Test whether an output is from a stream.
   */
  function isError(output: IOutput): output is IError
  /**
   * An output union type.
   */
  type IOutput =
    | IUnrecognizedOutput
    | IExecuteResult
    | IDisplayData
    | IStream
    | IError
}
