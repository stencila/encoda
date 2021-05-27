/**
 * [[include:src/codecs/ipynb/README.md]]
 *
 * @module codecs/ipynb
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
/* eslint-disable camelcase, @typescript-eslint/no-namespace */

import { getLogger } from '@stencila/logga'
import schema, { isEntity, nodeType } from '@stencila/schema'
import { dump, load } from '../..'
import { logWarnLoss } from '../../util/logging'
import { ensureArticle } from '../../util/content/ensureArticle'
import {
  ensureBlockContentArray,
  ensureBlockContentArrayOrUndefined,
} from '../../util/content/ensureBlockContentArray'
import * as dataUri from '../../util/dataUri'
import * as vfile from '../../util/vfile'
import { PlotlyCodec } from '../plotly'
import { TxtCodec } from '../txt'
import { Codec } from '../types'
import { VegaCodec } from '../vega'
import * as nbformat3 from './nbformat-v3'
import * as nbformat4 from './nbformat-v4'
import nbformat4Schema from './nbformat-v4.schema.json'

const vegaCodec = new VegaCodec()
const plotlyCodec = new PlotlyCodec()

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
    v4 = 4,
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
  public readonly decode = async (file: vfile.VFile): Promise<schema.Node> => {
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
  public readonly encode = async (node: schema.Node): Promise<vfile.VFile> => {
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
): Promise<schema.Article> {
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

  const { title, authors, meta, props } = await decodeMetadata(
    notebook.metadata
  )
  const content = await decodeCells(cells, version, language)

  return schema.article({
    title,
    authors,
    meta,
    ...props,
    content,
  })
}

/**
 * Encode a Stencila `Node` as a Jupyter `Notebook`.
 */
async function encodeNode(node: schema.Node): Promise<nbformat4.Notebook> {
  const article = ensureArticle(node)
  const { type, title, authors, meta, content = [], ...rest } = article

  const metadata = encodeMetadata(
    title,
    authors,
    meta,
    rest as Record<string, unknown>
  )
  const cells = await encodeCells(content)

  return {
    nbformat: 4,
    nbformat_minor: 4,
    metadata,
    cells,
  }
}

/**
 * Decode Jupyter Notebook metadata as `Article` metadata properties.
 *
 * This function performs coercion of the array of authors,
 * (e.g. from strings to `Person`s) rather than leaving it to a higher level
 * function e.g. `read` to do, because that higher level function does
 * not know that we expect it to be a list of `Person`s.
 *
 * Any properties in the metadata that are not properties of an
 * `Article` are placed in the `meta` property
 */
async function decodeMetadata(
  metadata: nbformat3.Notebook['metadata'] | nbformat4.Notebook['metadata']
): Promise<{
  title: schema.Article['title']
  authors: schema.Article['authors']
  meta: schema.Article['meta']
  props: Omit<schema.Article, 'type' | 'title' | 'authors' | 'meta' | 'content'>
}> {
  const { title, authors, ...rest } = metadata as {
    title?: string
    authors?: []
  }

  // Decode `authors` array
  const decodedAuthors =
    authors !== undefined
      ? ((
          await Promise.all(
            authors.map(
              async (
                author
              ): Promise<schema.Person | schema.Organization | undefined> => {
                if (schema.isA('Person', author)) {
                  // When encoding `name` is calculated from `givenNames`
                  // and `familyNames` to fit the IPYNB schema. Remove
                  // it if possible to avoid redundancy and have full
                  // reversibility of encoding / decoding
                  const { name, ...rest } = author as schema.Person
                  if ('givenNames' in rest || 'familyNames' in rest) return rest
                  else return author
                } else if (schema.isA('Organization', author)) {
                  return author
                } else if (typeof author === 'object') {
                  return {
                    type: 'Person',
                    ...(author as Omit<schema.Person, 'type'>),
                  } as schema.Person
                } else if (typeof author === 'string') {
                  return load(author, 'person') as Promise<schema.Person>
                } else {
                  return undefined
                }
              }
            )
          )
        ).filter((author) => author !== undefined) as (
          | schema.Person
          | schema.Organization
        )[])
      : undefined

  // Sort other properties of metadata into those that
  // are properties of an article, and those that are not
  const articleSchema = (await schema.jsonSchemas()).Article
  const propertyNames = Object.keys({
    ...articleSchema.properties,
    ...articleSchema.propertyAliases,
  })
  const meta: Record<string, unknown> = {}
  const props: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(rest)) {
    if (propertyNames.includes(key)) props[key] = value
    else meta[key] = value
  }

  return {
    title,
    authors: decodedAuthors,
    meta,
    props,
  }
}

/**
 * Encode a `Article`'s metadata properties as Jupyter Notebook metadata.
 *
 * The nbformat-v4 schema requires that `title` be a string
 * and that `authors` be an array of objects with a `name` string
 * property (and optional additional properties). This functions
 * conformance to those requirements.
 *
 * All standard Jupyter notebook metadata properties are
 * extracted from the the article's `meta` property and placed
 * at the top level of the metadata.
 */
function encodeMetadata(
  title: schema.Article['title'],
  authors: schema.Article['authors'],
  meta: schema.Article['meta'],
  rest: Record<string, unknown>
): nbformat3.Notebook['metadata'] | nbformat4.Notebook['metadata'] {
  if (title !== undefined && typeof title !== 'string') {
    logWarnLoss(
      'ipynb',
      'encode',
      'Only a simple string title is supported by Jupyter Notebooks'
    )
    title = TxtCodec.stringify(title)
  }

  if (authors !== undefined && authors.length > 0) {
    authors = authors.map((author) => {
      if (author.name === undefined) {
        if (schema.isA('Person', author)) {
          // A person: concatenate names
          const { givenNames = [], familyNames = [] } = author
          const names = [...givenNames, ...familyNames]
          return {
            ...author,
            name: names.length > 1 ? names.join(' ') : 'Anonymous',
          }
        } else {
          // An organization: use legal name if possible
          return {
            ...author,
            name: author.legalName ?? 'Anonymous',
          }
        }
      }
      return author
    })
  }

  if (meta !== undefined) {
    const notebookSchema = nbformat4Schema as {
      properties: { metadata: Record<string, unknown> }
    }
    const metadataNames = Object.keys(notebookSchema?.properties?.metadata)
    for (const [key, value] of Object.entries(meta)) {
      if (metadataNames.includes(key)) {
        rest[key] = value
        delete meta[key]
      }
    }
  }

  return {
    ...(title ? { title } : {}),
    ...(authors ? { authors } : {}),
    ...meta,
    ...rest,
  }
}

/**
 * Decode an array of Jupyter `Cells` to and array of Stencila `BlockContent` nodes.
 */
async function decodeCells(
  cells: (nbformat.v3.Cell | nbformat4.Cell)[],
  version: nbformat.Version = 4,
  language = 'python'
): Promise<schema.BlockContent[]> {
  const blocks: schema.BlockContent[] = []
  for (const cell of cells) {
    switch (cell.cell_type) {
      case 'markdown':
      case 'html':
        blocks.push(...(await decodeMarkdownCell(cell, cell.cell_type)))
        break
      // TODO: handle `heading` cells
      case 'code': {
        const chunk = await decodeCodeCell(cell, version, language)
        if (chunk) blocks.push(chunk)
        break
      }
      // TODO: handle `raw` cells
      default:
        // The above should handle all cell types but in case of an invalid
        // type, instead of throwing an error, return cell as a JSON code block of cell
        blocks.push({
          type: 'CodeBlock',
          programmingLanguage: 'json',
          text: JSON.stringify(cell),
        })
    }
  }
  return blocks
}

/**
 * Encode an array of Stencila `Node`s as an array of Jupyter `Cells`.
 */
async function encodeCells(nodes: schema.Node[]): Promise<nbformat4.Cell[]> {
  let content: schema.Node[] = []
  const cells: nbformat4.Cell[] = []
  for (const node of nodes) {
    switch (nodeType(node)) {
      case 'CodeChunk':
        if (content.length) {
          cells.push(await encodeMarkdownCell(content))
          content = []
        }
        cells.push(await encodeCodeChunk(node as schema.CodeChunk))
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
 *
 * Ignores cells with only whitespace in them.
 */
async function decodeMarkdownCell(
  cell: nbformat3.MarkdownCell | nbformat4.MarkdownCell,
  format: 'markdown' | 'html'
): Promise<schema.BlockContent[]> {
  // TODO: handle metadata
  const { source } = cell

  const markdown = decodeMultilineString(source).trim()
  if (markdown.length === 0) return []

  const content = await load(markdown, format === 'html' ? 'html' : 'md', {
    isStandalone: false,
  })
  return ensureBlockContentArray(content)
}

/**
 * Encode an array of Stencila `Node`s as a Jupyter `MarkdownCell`
 */
async function encodeMarkdownCell(
  nodes: schema.Node[]
): Promise<nbformat4.MarkdownCell> {
  // TODO: consider a md function that will return
  // a fragment, not a whole article
  const article = {
    type: 'Article',
    content: nodes,
  }

  const metadata = {}

  const markdown = await dump(article, 'md')
  const source = encodeMultilineString(markdown.trim())

  return {
    cell_type: 'markdown',
    metadata,
    source,
  }
}

/**
 * Decode a Jupyter `CodeCell` to a Stencila `CodeChunk`.
 *
 * If the cell has no code and no outputs then returns `undefined` (ie.
 * empty cells are ignored).
 *
 * If the cell metadata has a `caption` that is a string it will be attempted
 * to be decoded as Markdown.
 */
export async function decodeCodeCell(
  cell: nbformat3.CodeCell | nbformat4.CodeCell,
  version: nbformat.Version = 4,
  language = 'python'
): Promise<schema.CodeChunk | undefined> {
  const { metadata, outputs } = cell

  const [execution_count, source] = isv3(cell, 'Cell', version)
    ? [cell.prompt_number, cell.input]
    : [cell.execution_count, cell.source]

  if (source.length === 0 && outputs.length === 0) return undefined

  const { id, label, caption: cap, ...rest } = metadata as {
    id?: string
    label?: string
    caption?: string | schema.Node[]
  }

  let caption: schema.BlockContent[] | undefined
  if (typeof cap === 'string') {
    caption = ensureBlockContentArray(
      await load(cap, 'md', {
        isStandalone: false,
      })
    )
  } else if (cap !== undefined) {
    caption = ensureBlockContentArrayOrUndefined(cap)
  }

  return schema.codeChunk({
    text: decodeMultilineString(source),
    programmingLanguage: language,
    id,
    label,
    caption,
    meta: { ...rest, execution_count },
    outputs: outputs?.length
      ? await decodeOutputs(outputs, version)
      : undefined,
  })
}

/**
 * Encode a Stencila `CodeChunk` as a Jupyter `CodeCell`.
 */
export async function encodeCodeChunk(
  chunk: schema.CodeChunk
): Promise<nbformat4.CodeCell> {
  const { meta = {}, text, outputs = [], id, label, caption } = chunk

  const { execution_count = 1, ...rest } = meta

  const metadata = {
    ...(id ? { id } : {}),
    ...(label ? { label } : {}),
    ...(caption
      ? {
          caption:
            typeof caption === 'string'
              ? caption
              : (await dump(schema.article({ content: caption }), 'md')).trim(),
        }
      : {}),
    ...rest,
  }

  return {
    cell_type: 'code',
    metadata,
    execution_count,
    source: encodeMultilineString(text),
    outputs: await encodeOutputs(chunk, outputs),
  }
}

/**
 * Decode the `outputs` of a Jupyter `CodeCell` to an array of Stencila `Node`s.
 */
async function decodeOutputs(
  outputs: (nbformat3.Output | nbformat4.Output)[],
  version: nbformat.Version = 4
): Promise<schema.Node[]> {
  const nodes = await Promise.all(
    outputs.map((output) => decodeOutput(output, version))
  )

  // Remove any matplotlib plot string representations when there is also
  // an image output (ie the actual plot). See https://github.com/stencila/encoda/issues/146
  if (
    nodes.filter((node) => isEntity(node) && node.type === 'ImageObject')
      .length > 0
  ) {
    return nodes.filter(
      (node) => !(typeof node === 'string' && /^\[?<matplotlib\./.test(node))
    )
  }

  return nodes
}

function decodeOutput(
  output: nbformat3.Output | nbformat4.Output,
  version: nbformat.Version = 4
): Promise<schema.Node> {
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
        schema.codeBlock({
          text: JSON.stringify(output),
          programmingLanguage: 'json',
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
  chunk: schema.CodeChunk,
  nodes: schema.Node[]
): Promise<nbformat4.Output[]> {
  return Promise.all(
    nodes.map(async (node) => {
      if (typeof node === 'string') {
        return encodeStream(chunk, node)
      } else if (
        schema.isA('CodeBlock', node) &&
        node.programmingLanguage === 'text'
      ) {
        return encodeStream(chunk, node.text)
      } else if (schema.isA('ImageObject', node)) {
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
  chunk: schema.CodeChunk,
  node: schema.Node
): nbformat4.Stream {
  return {
    output_type: 'stream',
    name: 'stdout',
    text: node as string,
  }
}

/**
 * Encode a Stencila `Node` that is a `CodeChunk` `output` as a Jupyter `DisplayData`.
 */
async function encodeDisplayData(
  chunk: schema.CodeChunk,
  node: schema.Node
): Promise<nbformat4.DisplayData> {
  return {
    output_type: 'display_data',
    metadata: {},
    data: await encodeMimeBundle(node),
  }
}

/**
 * Encode a Stencila `Node` that is a `CodeChunk` `output` as a Jupyter `ExecuteResult`.
 */
async function encodeExecuteResult(
  chunk: schema.CodeChunk,
  node: schema.Node
): Promise<nbformat4.ExecuteResult> {
  const execution_count =
    (chunk.meta && parseInt(chunk.meta.execution_count)) || 1
  return {
    output_type: 'execute_result',
    execution_count,
    metadata: {},
    data: await encodeMimeBundle(node),
  }
}

/**
 * Decode a Jupyter `MimeBundle` to a Stencila `Node`.
 *
 * The bundle is a dictionary of {mediaType : content} with alternative representations
 * of the output e.g. JSON and plain text. This function attempts to decode the "richest"
 * / most easily parsable mimetypes first e.g JSON before plain text.
 */
async function decodeMimeBundle(
  bundle: nbformat.MimeBundle,
  version: nbformat.Version = 4
): Promise<schema.Node> {
  for (const mimetype of [
    ...plotlyCodec.mediaTypes,
    ...vegaCodec.mediaTypes,
    'image/png',
    'image/jpeg',
    'image/svg+xml',
    'application/json',
    'application/x-latex',
    'text/html',
    'text/plain',
    'application/javascript',
    'application/pdf',
  ]) {
    // For nbformat 3 it is necessary to convert the mimetype to a name
    const map: { [key: string]: string } = {
      'application/javascript': 'javascript',
      'application/json': 'json',
      'application/pdf': 'pdf',
      'application/x-latex': 'latex',
      'image/jpeg': 'jpeg',
      'image/png': 'png',
      'image/svg+xml': 'svg',
      'text/html': 'html',
      'text/plain': 'text',
    }
    const name = version === 3 ? map[mimetype] || mimetype : mimetype

    // If the bundle does not have a corresponding value
    // then continue trying other mimetypes
    const data = bundle[mimetype] || bundle[name]
    if (data === undefined) continue

    // Convert data to a string
    const text =
      typeof data === 'string'
        ? data
        : Array.isArray(data)
        ? data.join('')
        : data.toString()

    if (plotlyCodec.mediaTypes.includes(mimetype)) {
      return plotlyCodec.load(JSON.stringify(data))
    }
    if (vegaCodec.mediaTypes.includes(mimetype)) {
      return vegaCodec.load(JSON.stringify(data))
    } else if (mimetype.startsWith('image/')) {
      // Image mime types as `ImagesObject`
      return schema.imageObject({
        contentUrl: `data:${mimetype};base64,${data}`,
        format: mimetype,
      })
    } else if (mimetype === 'text/plain') {
      // Text output, including stdout, is decoded using the `txt` codec
      // which attempts to parse `numbers` etc (and may in the future,
      // attempt to parse fixed with table etc). However, if the result
      // is a `string` (`txt` could not decode anything), containing
      // preformatting (tabs, newlines or more than one consecutive space),
      // then decode as a `CodeBlock` since formatting is
      // often important in text output of cells.
      const node = await load(text, 'txt')
      if (typeof node === 'string' && /[ ]{2,}|\t|\n/g.test(node))
        return schema.codeBlock({ text: node, programmingLanguage: 'text' })
      else return node
    } else {
      const node = await load(text, mimetype)
      if (node === null) continue
      else return node
    }
  }
  log.warn(
    `Unable to decode MIME bundle with keys: ${Object.keys(bundle).join(', ')}`
  )
  return ''
}

/**
 * Encode a Stencila `Node` as a Jupyter `MimeBundle`.
 *
 * The MIME type (aka media type) of the bundle is determined
 * by the type of `Node`.
 */
async function encodeMimeBundle(
  node: schema.Node
): Promise<nbformat.MimeBundle> {
  const [mediaType, data] = await (async (): Promise<[string, string]> => {
    switch (nodeType(node)) {
      case 'String':
        return ['text/plain', await dump(node, 'text')]
      case 'ImageObject': {
        const image = node as schema.ImageObject
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
    .map((line) => line + '\n')
    .concat(lines.slice(-1))
}
