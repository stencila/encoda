import { Jesta, Manifest } from '@stencila/jesta'
import { getLogger } from '@stencila/logga'
import schema from '@stencila/schema'
import fs from 'fs-extra'
import mime from 'mime'
import path from 'path'
import {
  Codec,
  commonDecodeDefaults,
  CommonDecodeOptions,
  commonEncodeDefaults,
  CommonEncodeOptions,
} from './codecs/types'
import * as puppeteer from './util/puppeteer'
import * as vfile from './util/vfile'

import manifest from '../codemeta.json'

const log = getLogger('encoda')

/**
 * To read or write from the STDIO a special `filePath` value of `-` can
 * be used with several of the encode/decode functions.
 */
export const STDIO_PATH = '-'

/**
 * A list of all codecs.
 *
 * Note that order is of importance for matching. More "generic"
 * formats should go last. See the `match` function.
 */
export const codecList: string[] = [
  // Publishers of content
  'elife',
  'plos',

  // Publishers of meta data
  // DOI comes after publishers so that it does not match DOIs
  // that are specific to a publisher e.g. 10.1371/journal.pone.0216012
  'doi',
  'orcid',

  // HTTP. Comes after publishers so that it does not match urls
  // that are specific to a publisher e.g. https://elifesciences.org
  'http',

  // Directories
  'dir',
  'dar',

  // Tabular data, spreadsheets etc
  'csv',
  'ods',
  'tdp',
  'xlsx',

  // Articles, textual documents etc
  'docx',
  'gdoc',
  'html',
  'ipynb',
  'jats',
  'jats-pandoc',
  'latex',
  'md',
  'odt',
  'pdf',
  'txt',
  'xmd',

  // Math
  'mathml',
  'tex',

  // Scripts
  'dmagic',

  // Images
  'rpng',
  'png',

  // Plotting
  'plotly',

  // Data interchange formats
  'yaml',
  'pandoc',
  'json5',
  'jsonld',
  'json',
  'xml',
]

/**
 * Match the codec based on file name, extension name, media type or by content sniffing.
 *
 * Iterates through the list of codecs and returns the first that matches based on any
 * of the above criteria.
 *
 * If the supplied format contains a forward slash then it is assumed to be a media type,
 * otherwise an extension name.
 *
 * If trying to find a codec for an output, then `content` is more likely to be a path than
 * actual content. This is passed through to `vfile.isPath` for detection.
 *
 * @param content The content as a file path (e.g. `../folder/file.txt`) or raw content
 * @param format The format as a media type (e.g. `text/plain`) or extension name (e.g. `txt`)
 * @param isOutput `true` if attempting to find a match for an output file
 * @returns A promise that resolves to the `Codec` to use
 */
export async function match(
  content?: string,
  format?: string,
  isOutput = false
): Promise<Codec> {
  // Resolve variables used to match a codec...
  let fileName: string | undefined
  let extName: string | undefined
  let mediaType: string | undefined

  // If the content is a path then begin with derived values
  if (content !== undefined && (vfile.isPath(content) || isOutput)) {
    fileName = path.basename(content)
    extName = path.extname(content).slice(1).toLowerCase()
    mediaType = mime.getType(content) ?? undefined
  }

  if (format !== undefined) {
    // Override with supplied format assuming that
    // media types always have a forward slash and extension names
    // never do.
    if (format.includes('/')) mediaType = format
    else {
      extName = format
      mediaType = mime.getType(extName) ?? undefined
    }
  }

  /**
   * Get a `Codec` instance from a codec name
   */
  const getCodec = async (name: string): Promise<Codec | undefined> => {
    try {
      const exports: { [key: string]: unknown } = await import(
        `./codecs/${name}`
      )
      for (const C in exports) {
        // @ts-ignore
        if (exports[C].prototype instanceof Codec) {
          // @ts-ignore
          return new exports[C]()
        }
      }
    } catch (error) {
      // Do not log MODULE_NOT_FOUND warnings here since not finding a matching module
      // is normal behavior and doing so causes unnecessary noise and anxiety :)
      // (But do warn if a module other than that looked for was not found!)
      if (
        !(
          error.code === 'MODULE_NOT_FOUND' &&
          error.message.includes(name) === true
        )
      )
        log.warn(error)
    }
  }

  let codec: Codec | undefined

  // Attempt to match extension name to codec name
  // This is a shortcut attempted before iterating over codecs in codecList
  if (extName !== undefined) {
    // LaTeX files usually have a `tex` extension. Without this
    // exception they get prematurely matched to the TeX codec (for math)
    const codecName = extName === 'tex' ? 'latex' : extName
    codec = await getCodec(codecName)
  }
  if (codec !== undefined) return codec

  // Iterate through codecs searching for a match
  for (const codecName of codecList) {
    codec = await getCodec(codecName)
    if (codec === undefined) continue

    if (fileName !== undefined && codec.fileNames?.includes(fileName)) {
      return codec
    }

    if (extName !== undefined && codec.extNames?.includes(extName)) {
      return codec
    }

    if (mediaType !== undefined && codec.mediaTypes?.includes(mediaType)) {
      return codec
    }

    if (
      content !== undefined &&
      codec.sniff !== undefined &&
      (await codec.sniff(content))
    ) {
      return codec
    }
  }

  let message = 'No codec could be found'
  if (content !== undefined) message += ` for source "${content}"`
  if (format !== undefined) message += ` for format "${format}"`
  message += '. Falling back to plain text codec.'
  log.warn(message)

  // @ts-ignore
  return getCodec('txt')
}

/**
 * Is the file path, or media type handled? (i.e. is there a codec for it?)
 *
 * @param content The file path
 * @param format The media type
 */
export async function handled(
  content?: string,
  format?: string
): Promise<boolean> {
  try {
    await match(content, format)
    return true
  } catch (error) {
    return false
  }
}

/**
 * Load a `stencila.Node` from a string of content.
 *
 * @param content The content to load.
 * @param format The format to load the content as.
 */
export async function load<Options extends CommonDecodeOptions>(
  content: string,
  format: string,
  options: Options = commonDecodeDefaults as Options
): Promise<schema.Node> {
  const codec = await match(content, format)
  return codec.load(content, { format, ...options })
}

/**
 * Dump a `stencila.Node` to a string of content.
 *
 * @param node The node to dump.
 * @param format The format to dump the node as.
 * @param options Encoding options.
 */
export async function dump<Options extends CommonEncodeOptions>(
  node: schema.Node,
  format: string,
  options: Options = commonEncodeDefaults as Options
): Promise<string> {
  const codec = await match(undefined, format, true)
  return codec.dump(node, { format, ...options })
}

/**
 * Read a file to a `stencila.Node`.
 *
 * @param source The raw content or file path to read.
 *                Use `-` to read from standard input.
 * @param format The format to read the file as.
 *               If undefined then determined from content or file path.
 */
export async function read<Options extends CommonDecodeOptions>(
  source: string,
  format?: string,
  options: Options = commonDecodeDefaults as Options
): Promise<schema.Node> {
  const codec = await match(source, format)
  return codec.read(source, { format, ...options })
}

/**
 * Write a `stencila.Node` to a file.
 *
 * @param node The node to write.
 * @param filePath The file system path to write to.
 *                 Use `-` write to standard output.
 * @param options Encoding options.
 */
export async function write<Options extends CommonEncodeOptions>(
  node: schema.Node,
  filePath: string,
  options: Options = commonEncodeDefaults as Options
): Promise<void> {
  const { format } = { ...commonEncodeDefaults, ...options }
  const codec = await match(filePath, format, true)
  return codec.write(node, filePath, options)
}

interface ConvertOptions {
  from?: string
  to?: string
  decodeOptions?: CommonDecodeOptions
  encodeOptions?: CommonEncodeOptions
}

/**
 * Convert content from one format to another.
 *
 * @param input The input content (raw or file path).
 * @param outputPaths The output file path/s.
 * @param options Conversion options e.g `from` and `to`: to specify the formats to convert from/to
 * @returns The converted content, or file path (for converters that only write to files).
 */
export async function convert(
  input: string,
  outputPaths?: string | string[],
  options: ConvertOptions = {}
): Promise<string | undefined> {
  let { from, decodeOptions, to, encodeOptions } = options

  const node = await read(input, from, decodeOptions)

  if (outputPaths === undefined) outputPaths = [STDIO_PATH]
  else if (typeof outputPaths === 'string') outputPaths = [outputPaths]

  let index = 0
  const files: string[] = []
  for (const outputPath of outputPaths) {
    // Explicitly deal with output to stdout indicator
    // rather than deferring to `vfile.write` to handle it.
    // This avoids calling `preWrite` which may create files
    // which we don't if outputting to stdout. Instead `preDump`
    // will get called which bundles media files etc.
    if (outputPath === STDIO_PATH) {
      const content = await dump(node, to ?? 'txt', encodeOptions)
      console.log(content)
      if (outputPaths.length > 0) return content
      continue
    }

    await write(node, outputPath, { format: to, ...encodeOptions })

    // Record files generated
    files.push(outputPath)

    // The convention amongst codecs is to put media files in
    // a sibling folder with `.media` appended to the name
    // We rely on that convention here...
    const mediaFolder = outputPath + '.media'
    if (await fs.pathExists(mediaFolder)) {
      for (const child of await fs.readdir(mediaFolder))
        files.push(path.join(mediaFolder, child))
    }

    // The `to` option only applies to the first output
    to = undefined

    // Return the path of the last output file
    index += 1
    if (index === outputPaths.length) {
      return outputPath
    }
  }
}

/**
 * Shutdown Encoda.
 *
 * Some modules need to be explicitly shutdown to prevent
 * node from hanging. This functions collects those in one
 * place.
 */
export async function shutdown(): Promise<void> {
  await puppeteer.shutdown()
}

/// ////////////////////////////////////////////////////////////////////////////
// Implementation of plugin interface by extending Jesta

const jesta = new Jesta()

// Extend codecs list with some other aliases
const formats = [...codecList, 'rmd']

/**
 * Implementation of Stencila plugin method `decode`.
 *
 * Delegates to the codec that matches the input format
 * with the content loaded into a `VFile`.
 * Extends Jesta's method schema with all the formats
 * supported by Encoda.
 */
export async function decode(
  this: Encoda,
  content: string,
  format: string | undefined
): Promise<schema.Node> {
  const codec = await match(content, format)
  return codec.decode(vfile.load(content))
}
decode.schema = jesta.decode.schema
// @ts-ignore
decode.schema.properties.format.enum = formats

/**
 * Implementation of Stencila plugin method `encode`.
 *
 * Delegates to the codec that matches the output format
 * and dumps the `VFile` content to a string.
 * Extends Jesta's method schema with all the formats
 * supported by Encoda.
 */
export async function encode(
  this: Encoda,
  node: schema.Node,
  format: string
): Promise<string> {
  const codec = await match(undefined, format)
  return vfile.dump(await codec.encode(node))
}
encode.schema = jesta.encode.schema
// @ts-ignore
encode.schema.properties.format.enum = formats

/**
 * Implementation of Stencila plugin method `convert`.
 *
 * Override necessary for binary formats such as `docx` to allow
 * codecs to do reading and writing of files (via a `Vfile`)
 * rather than always using Jesta's implementations of `read` and `write`.
 *
 * Extends Jesta's method schema with all the formats supported by Encoda.
 */
const convert_ = jesta.convert
// @ts-ignore
convert_.schema.properties.from.enum = formats
// @ts-ignore
convert_.schema.properties.to.enum = formats

export class Encoda extends Jesta {
  manifest = (manifest as unknown) as Manifest
  decode = decode
  encode = encode
  convert = convert_
}

export const encoda = new Encoda()

if (require.main === module) encoda.cli()
