import { getLogger } from '@stencila/logga'
import * as stencila from '@stencila/schema'
import fs from 'fs-extra'
import mime from 'mime'
import path from 'path'
import {
  Codec,
  commonDecodeDefaults,
  CommonDecodeOptions,
  commonEncodeDefaults,
  CommonEncodeOptions
} from './codecs/types'
import * as puppeteer from './util/puppeteer'
import * as vfile from './util/vfile'
import * as zip from './util/zip'

const log = getLogger('encoda')

type VFile = vfile.VFile

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

  // Scripts
  'dmagic',

  // Images,
  'rpng',
  'png',

  // Data interchange formats
  'yaml',
  'pandoc',
  'json5',
  'jsonld',
  'json',
  'xml'
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
    extName = path
      .extname(content)
      .slice(1)
      .toLowerCase()
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

  // Attempt to match extension name to codec
  if (extName !== undefined) codec = await getCodec(extName)
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
 * Decode a virtual file to a `stencila.Node`
 *
 * @param file The `VFile` to decode
 * @param content The file path
 * @param format The media type
 */
export async function decode<Options extends CommonDecodeOptions>(
  file: VFile,
  content?: string,
  options: Options = commonDecodeDefaults as Options
): Promise<stencila.Node> {
  const { format } = options
  const codec = await match(content, format)
  return codec.decode(file, options)
}

/**
 * Encode (i.e. serialize) a `stencila.Node` to a virtual file.
 *
 * @param node The node to encode
 * @param options Encoding options. Should include at least one of:
 *    - filePath The file path to encode the node to.
 *               Only required for some codecs e.g. those encoding to more than one file.
 *    - format The format to encode the node as.
 *             If undefined then determined from filePath or file path.
 */
export async function encode<Options extends CommonEncodeOptions>(
  node: stencila.Node,
  options: Options = commonEncodeDefaults as Options
): Promise<VFile> {
  const { filePath, format } = options
  if ((filePath ?? format) === undefined) {
    throw new Error(
      'At least one of "filePath" or "format" option must be provided'
    )
  }
  const codec = await match(filePath, format, true)
  return codec.encode(node, options)
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
): Promise<stencila.Node> {
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
  node: stencila.Node,
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
): Promise<stencila.Node> {
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
  node: stencila.Node,
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

  if (outputPaths === undefined) return dump(node, to ?? 'txt', encodeOptions)
  else if (typeof outputPaths === 'string') outputPaths = [outputPaths]

  let index = 0
  const { shouldZip } = { ...commonEncodeDefaults, ...encodeOptions }
  const files: string[] = []
  for (const outputPath of outputPaths) {
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

    // Return the path of the last output file,
    // or the zip file, if one was produced.
    index += 1
    if (index === outputPaths.length) {
      if (shouldZip === 'yes' || (files.length > 1 && shouldZip === 'maybe')) {
        const first = outputPaths[0]
        let zipName = 'output.zip'
        let outputDir = ''
        if (outputPaths.length === 1 && first !== undefined) {
          const { dir, name } = path.parse(first)
          zipName = path.join(dir, name + '.zip')
          outputDir = dir
        }
        return zip.create(zipName, files, { remove: true, dir: outputDir })
      } else return outputPath
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
