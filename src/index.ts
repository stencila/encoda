import stencila from '@stencila/schema'
import getStdin from 'get-stdin'
import mime from 'mime'
import path from 'path'
import * as csv from './csv'
import * as html from './html'
import * as json from './json'
// import * as md from './md';
import * as ods from './ods'
import * as tdp from './tdp'
import * as vfile from './vfile'
import * as xlsx from './xlsx'
import * as yaml from './yaml'

type VFile = vfile.VFile

/**
 * A list of all compilers.
 *
 * Note that order is of importance for matching. More "generic"
 * formats should go last. See the `match` function.
 */
const compilerList: Array<Compiler> = [
  //  gdoc,
  //  rpng,
  ods,
  tdp,
  xlsx,

  csv,
  // md,

  yaml,
  html,
  json
]

/**
 * The interface for a compiler.
 *
 * A compiler is simply a module with these constants
 * and functions (some of which are optional).
 *
 * Note that our use of the term "compiler", is consistent with our usage elsewhere in Stencila
 * as something that creates or modifies executable document, and
 * differs from the usage of [`unified`](https://github.com/unifiedjs/unified#processorcompiler).
 */
interface Compiler {
  /**
   * An array of [IANA Media Type](https://www.iana.org/assignments/media-types/media-types.xhtml)
   * that the compiler can parse/unparse.
   */
  mediaTypes: Array<string>

  /**
   * Any array of file names to use to match the compiler.
   * This can be useful for differentiating between
   * flavours of formats like JSON e.g. `datapackage.json` versus any old `.json` file.
   */
  fileNames?: Array<string>

  /**
   * Any array of file name extensions to register for the compiler.
   * This can be useful for specifying conversion to less well known media types
   * e.g. `--to tdp` for outputting `datapackage.json` to the console.
   */
  extNames?: Array<string>

  /**
   * A function that does directory or [content sniffing](https://en.wikipedia.org/wiki/Content_sniffing)
   * to determine if the compiler is able to parse the content.
   */
  sniff?: (filePath: string) => Promise<boolean>

  /**
   * Parse a `Vfile` to a `stencila.Node`.
   *
   * @param file The `VFile` to parse
   * @returns A promise that resolves to a `stencila.Node`
   */
  parse: (file: VFile) => Promise<stencila.Node>

  /**
   * Unparse a `stencila.Node` to a `VFile`.
   *
   * @param thing The `stencila.Node` to unparse
   * @param filePath The file system path to unparse to
   *                 (Can be used by compilers that need to write more than one file when unparsing)
   * @returns A promise that resolves to a `VFile`
   */
  unparse: (node: stencila.Node, filePath?: string) => Promise<VFile>
}

/**
 * Match the compiler based on file name, extension name, media/type or by content sniffing.
 *
 * Iterates through the compilers and returns that matches any of the criteria.
 *
 * @param filePath The file path
 * @param mediaType The media type (e.g. `text/plain`) or the corresponding extension (e.g. `txt`)
 * @returns A promise that resolves to the `Compiler` to use
 */
export async function match(
  filePath?: string,
  mediaType?: string
): Promise<Compiler> {
  let fileName = filePath ? path.basename(filePath) : undefined
  let extName = filePath ? path.extname(filePath) : undefined

  if (mediaType) {
    // For convenience, media type may be supplied as an extension name e.g. `md`.
    // So if the supplied value isn't a valid media type, look it up and if found then
    // use that, otherwise use the supplied value as an extension name.
    if (mime.getExtension(mediaType) === null) {
      let inferredMediaType = mime.getType(mediaType)
      if (!inferredMediaType) extName = mediaType
      else mediaType = inferredMediaType
    }
  } else if (filePath) {
    // Try to determine the media type from the path
    mediaType = mime.getType(filePath) || undefined
  }

  for (let compiler of compilerList) {
    if (
      fileName &&
      compiler.fileNames &&
      compiler.fileNames.includes(fileName)
    ) {
      return compiler
    }
    if (extName && compiler.extNames && compiler.extNames.includes(extName)) {
      return compiler
    }
    if (
      mediaType &&
      compiler.mediaTypes &&
      compiler.mediaTypes.includes(mediaType)
    ) {
      return compiler
    }
    if (filePath && compiler.sniff && (await compiler.sniff(filePath))) {
      return compiler
    }
  }

  let message = 'No compiler could be found'
  if (filePath) message += ` for file path "${filePath}"`
  if (mediaType) message += ` for media type "${mediaType}"`
  message += '.'
  throw new Error(message)
}

export async function handled(
  filePath?: string,
  mediaType?: string
): Promise<boolean> {
  try {
    await match(filePath, mediaType)
    return true
  } catch (error) {
    return false
  }
}

export async function parse(
  file: VFile,
  filePath?: string,
  mediaType?: string
): Promise<stencila.Node> {
  const compiler = await match(filePath, mediaType)
  return compiler.parse(file)
}

export async function unparse(
  node: stencila.Node,
  filePath?: string,
  mediaType?: string
): Promise<VFile> {
  const compiler = await match(filePath, mediaType)
  return compiler.unparse(node, filePath)
}

export async function load(
  content: string,
  mediaType: string
): Promise<stencila.Node> {
  const file = vfile.load(content)
  return parse(file, undefined, mediaType)
}

export async function dump(
  node: stencila.Node,
  mediaType: string
): Promise<string> {
  const file = await unparse(node, undefined, mediaType)
  return vfile.dump(file)
}

export async function read(
  filePath?: string,
  mediaType?: string
): Promise<stencila.Node> {
  let file
  if (filePath) file = await vfile.read(filePath)
  else file = vfile.load(await getStdin())
  return parse(file, filePath, mediaType)
}

export async function write(
  node: stencila.Node,
  filePath?: string,
  mediaType?: string
): Promise<void> {
  let file = await unparse(node, filePath, mediaType)
  if (!filePath) console.log(vfile.dump(file))
  else await vfile.write(file, filePath)
}

/**
 * Convert from one format to another
 *
 * @param inp The input path. If missing stdin is used.
 * @param out The output path. If missing stdout is used.
 * @param from The format to convert the input from.
 * @param to The format to convert the output to.
 */
export async function convert(
  inp?: string,
  out?: string,
  from?: string,
  to?: string
): Promise<void> {
  const node = await read(inp, from)
  await write(node, out, to)
}
