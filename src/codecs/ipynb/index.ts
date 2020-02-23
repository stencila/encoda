/**
 * @module ipynb
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

// These eslint-disable are necessary due to automatically generated nbformat type
// definitions
/* eslint-disable @typescript-eslint/camelcase, @typescript-eslint/no-namespace */

import { getLogger } from '@stencila/logga'
import stencila, { isEntity, nodeType } from '@stencila/schema'
import Ajv from 'ajv'
import jsonSchemaDraft04 from 'ajv/lib/refs/json-schema-draft-04.json'
import betterAjvErrors from 'better-ajv-errors'
import { dump, load } from '../..'
import * as dataUri from '../../util/dataUri'
import * as vfile from '../../util/vfile'
import { Codec } from '../types'
import * as nbformat3 from './nbformat-v3'
import nbformat3Schema from './nbformat-v3.schema.json'
import * as nbformat4 from './nbformat-v4'
import nbformat4Schema from './nbformat-v4.schema.json'
import { coerce } from '../../util/coerce'
import { stringifyContent } from '../../util/content/stringifyContent'

const log = getLogger('encoda:ipynb')

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

export class IpynbCodec extends Codec implements Codec {
  /**
   * The media types that this codec can decode/encode.
   */
  public readonly mediaTypes = ['application/x-ipynb+json']

  /**
   * The file extension names associated with this codec.
   */
  public readonly extNames = ['ipynb']

  /**
   * Decode a `VFile` with IPYNB content to a Stencila `Node`.
   *
   * @param file The `VFile` to decode
   * @returns A promise that resolves to a Stencila `Node`
   */
  public readonly decode = async (
    file: vfile.VFile
  ): Promise<stencila.Node> => {
    const json = await vfile.dump(file)
    const ipynb = JSON.parse(json)
    await validateNotebook(ipynb)
    return decodeNotebook(ipynb, ipynb.nbformat)
  }

  /**
   * Encode a Stencila `Node` to a `VFile` with IPYNB content.
   *
   * @param thing The Stencila `Node` to encode
   * @returns A promise that resolves to a `VFile`
   */
  public readonly encode = async (
    node: stencila.Node
  ): Promise<vfile.VFile> => {
    const ipynb = await encodeNode(node)
    await validateNotebook(ipynb)
    const json = JSON.stringify(ipynb, null, '  ')
    return vfile.load(json)
  }
}

/**
 * Validation functions for `nbformat` `v3` and `v4`
 */
const validators = new Ajv({
  // For use with draft-04 schemas
  schemaId: 'auto',
  // For better error reporting
  jsonPointers: true
})
validators.addMetaSchema(jsonSchemaDraft04)

/**
 * Validate a notebook against a version of `nbformat` JSON Schema
 *
 * This function only logs a warning if the notebook does not validate
 * against the schema. It is intended to provide additional
 * information for debugging other subsequent errors wth decoding
 * if a notebook is corrupted.
 */
function validateNotebook(
  notebook: nbformat3.Notebook | nbformat4.Notebook
): Promise<void> {
  const schemaKey = `nbformat-v${notebook.nbformat}.schema.json`
  let validator = validators.getSchema(schemaKey)
  if (!validator) {
    try {
      const schema = notebook.nbformat === 3 ? nbformat3Schema : nbformat4Schema
      validators.addSchema(schema, schemaKey)
      validator = validators.getSchema(schemaKey)
    } catch (error) {
      log.error(`Error when attempting to add schema: ${error.message}`)
    }
  }
  if (!validator(notebook)) {
    const message = (betterAjvErrors(
      validator.schema,
      notebook,
      validator.errors,
      {
        format: 'cli',
        indent: 2
      }
    ) as unknown) as string
    log.warn(`Notebook is not valid:\n${message}`)
  }
  return Promise.resolve()
}

/**
 * Decode a Jupyter `Notebook` to a Stencila `Article`.
 */
async function decodeNotebook(
  notebook: nbformat3.Notebook | nbformat4.Notebook,
  version: nbformat.Version = 4
): Promise<stencila.Article> {
  const metadata = await decodeMetadata(notebook.metadata)

  let language = 'python'
  let cells
  if (isv3(notebook, 'Notebook', version)) {
    const kernelInfo = notebook.metadata.kernel_info
    if (kernelInfo !== undefined) {
      language = kernelInfo.language
    }
    cells = notebook.worksheets[0].cells
  } else {
    const languageInfo = notebook.metadata.language_info
    if (languageInfo !== undefined) {
      language = languageInfo.name
    }
    cells = notebook.cells
  }

  const content = await decodeCells(cells, version, language)

  return {
    type: 'Article',
    ...metadata,
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
    title: stringifyContent(title ?? ''),
    authors
  }

  const cells = await encodeCells(content ?? [])

  return {
    nbformat: 4,
    nbformat_minor: 4,
    metadata,
    cells
  }
}

/**
 * Decode a notebook metadata.
 */
async function decodeMetadata(
  metadata: nbformat3.Notebook['metadata'] | nbformat4.Notebook['metadata']
): Promise<{
  title: string
  authors: stencila.Person[]
  meta: { [key: string]: unknown }
}> {
  // Extract handled properties
  const { title = 'Untitled', authors = [], ...rest } = metadata

  // Decode authors to `Person` nodes
  const people = authors.map(
    async (author: string | object): Promise<stencila.Person> => {
      return typeof author === 'string'
        ? (load(author, 'person') as Promise<stencila.Person>)
        : coerce(author, 'Person')
    }
  )

  return {
    title,
    authors: await Promise.all(people),
    meta: { ...rest }
  }
}

/**
 * Decode an array of Jupyter `Cells` to and array of Stencila `BlockContent` nodes.
 */
async function decodeCells(
  cells: (nbformat.v3.Cell | nbformat4.Cell)[],
  version: nbformat.Version = 4,
  language = 'python'
): Promise<stencila.BlockContent[]> {
  const blocks: stencila.BlockContent[] = []
  for (const cell of cells) {
    switch (cell.cell_type) {
      case 'markdown':
      case 'html':
        blocks.push(...(await decodeMarkdownCell(cell, cell.cell_type)))
        break
      // TODO: handle `heading` cells
      case 'code':
        blocks.push(await decodeCodeCell(cell, version, language))
        break
      // TODO: handle `raw` cells
      default:
        // The above should handle all cell types but in case of an invalid
        // type, instead of throwing an error, return cell as a JSON code block of cell
        blocks.push({
          type: 'CodeBlock',
          programmingLanguage: 'json',
          text: JSON.stringify(cell)
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
  format: 'markdown' | 'html'
): Promise<stencila.BlockContent[]> {
  // TODO: handle metadata
  const { source } = cell
  const markdown = decodeMultilineString(source)
  const node = await load(markdown, format === 'html' ? 'html' : 'md')
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
  version: nbformat.Version = 4,
  language = 'python'
): Promise<stencila.CodeChunk> {
  const { metadata, outputs } = cell

  const [execution_count, source] = isv3(cell, 'Cell', version)
    ? [cell.prompt_number, cell.input]
    : [cell.execution_count, cell.source]

  return stencila.codeChunk({
    text: decodeMultilineString(source),
    programmingLanguage: language,
    meta: { ...metadata, execution_count },
    outputs: outputs?.length ? await decodeOutputs(outputs, version) : undefined
  })
}

/**
 * Encode a Stencila `CodeChunk` as a Jupyter `CodeCell`.
 */
async function encodeCodeChunk(
  chunk: stencila.CodeChunk
): Promise<nbformat4.CodeCell> {
  const metadata = {}
  const execution_count =
    (chunk.meta && parseInt(chunk.meta.execution_count)) || 1
  const source = encodeMultilineString(chunk.text || '')
  const outputs: nbformat4.Output[] = await encodeOutputs(
    chunk,
    chunk.outputs ?? []
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

function decodeOutput(
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
      return decodeMimeBundle({ 'text/plain': output.text }, version)
    case 'error':
    case 'pyerr':
      // TODO: decode error
      return Promise.resolve('')
    default:
      // The above should handle all output types but in case of an invalid
      // type, instead of throwing an error, return a JSON code block of output
      return Promise.resolve(
        stencila.codeBlock({
          text: JSON.stringify(output),
          programmingLanguage: 'json'
        })
      )
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
function encodeOutputs(
  chunk: stencila.CodeChunk,
  nodes: stencila.Node[]
): Promise<nbformat4.Output[]> {
  return Promise.all(
    nodes.map(async node => {
      if (typeof node === 'string') {
        return encodeStream(chunk, node)
      } else if (
        stencila.isA('CodeBlock', node) &&
        node.programmingLanguage === 'text'
      ) {
        return encodeStream(chunk, node.text)
      } else if (stencila.isA('ImageObject', node)) {
        return encodeDisplayData(chunk, node)
      }
      return encodeExecuteResult(chunk, node)
    })
  )
}

/**
 * Encode a `string` that is a `CodeChunk` `output` as a Jupyter `Stream`.
 */
function encodeStream(
  chunk: stencila.CodeChunk,
  node: stencila.Node
): nbformat4.Stream {
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
  const execution_count =
    (chunk.meta && parseInt(chunk.meta.execution_count)) || 1
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
      // Image mime types as `ImagesObject`
      const dataUrl = `data:${mimetype};base64,${content}`
      const { mediaType: format, filePath: contentUrl } = await dataUri.toFile(
        dataUrl
      )
      return stencila.imageObject({ contentUrl, format })
    } else if (mimetype === 'text/plain') {
      // Text output, including stdout, is decoded using the `txt` codec
      // which attempts to parse `numbers` etc (and may in the future,
      // attempt to parse fixed with table etc). However, if the result
      // is a `string` (`txt` could not decode anything), containing
      // preformatting (tabs, newlines or more than one consecutive space),
      // then decode as a `CodeBlock` since formatting is
      // often important in text output of cells.
      const node = await load(content, 'txt')
      if (typeof node === 'string' && /[ ]{2,}|\t|\n/g.test(node))
        return stencila.codeBlock({ text: node, programmingLanguage: 'text' })
      else return node
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
      case 'Text':
        return ['text/plain', await dump(node, 'text')]
      case 'ImageObject': {
        const image = node as stencila.ImageObject
        const { mediaType, dataUri: dataUrl } = await dataUri.fromFile(
          image.contentUrl
        )
        const data = dataUrl.split('base64,').pop() ?? ''
        return [mediaType, data]
      }
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
