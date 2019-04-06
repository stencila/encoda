import { Thing } from '@stencila/schema'
import getStdin from 'get-stdin'
// @ts-ignore
import mime from 'mime'
import * as csv from './csv'
import * as gdoc from './gdoc'
import * as html from './html'
import * as json from './json'
import * as md from './md'
import * as ods from './ods'
import * as rpng from './rpng'
import * as vfile from './vfile'
import * as xlsx from './xlsx'
import * as yaml from './yaml'

type VFile = vfile.VFile

/**
 * A list of all compilers.
 *
 * Note that order is of importance when the media type for a given
 * file path or extension can not be determined, since the first compiler
 * which returns `true` when `sniff`ing the file will be used.
 */
const compilerList: Array<Compiler> = [
  // Binary formats where sniffing may help resolve media type
  ods,
  rpng,
  xlsx,

  // Text formats where sniffing may help resolve media type
  html,

  // Text formats where sniffing will not help resolve media type (much)
  csv,
  gdoc,
  json,
  md,
  yaml
]

/**
 * A map of media types to compiler.
 *
 * Used for revolving the compiler to use for a given
 * a file system path, extension name, or media type.
 */
const compilerMap: { [key: string]: Compiler } = {}
for (let compiler of compilerList) {
  for (let medium of compiler.mediaTypes) {
    compilerMap[medium] = compiler
  }
}

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
   * that the compiler can parse/unparse
   */
  mediaTypes: Array<string>

  /**
   * A function that does [content sniffing](https://en.wikipedia.org/wiki/Content_sniffing)
   * of a file path to determine if the compiler is able to parse the content.
   */
  sniff?: (filePath: string) => Promise<boolean>

  /**
   * Parse a `Vfile` to a `Thing`.
   *
   * @param file The `VFile` to parse
   * @returns A promise that resolves to a `Thing`
   */
  parse: (file: VFile) => Promise<Thing>

  /**
   * Unparse a `Thing` to a `VFile`.
   *
   * @param thing The `Thing` to unparse
   * @param filePath The file system path to unparse to
   *                 (Can be used by compilers that need to write more than one file when unparsing)
   * @returns A promise that resolves to a `VFile`
   */
  unparse: (thing: Thing, filePath?: string) => Promise<VFile>
}

/**
 * Resolve the compiler to use to parse/unparse from/to a file path or media type.
 *
 * Resolution is attempted on the basis of media type first and then, if that
 * fails, using the `sniff()` function.
 *
 * @param filePath The file path
 * @param mediaType The media type
 * @returns A promise that resolves to the `Compiler` to use
 */
export async function resolve(
  filePath?: string,
  mediaType?: string
): Promise<Compiler> {
  if (mediaType) {
    // For convenience, media type may be supplied as an extension name e.g. `md`.
    // So if the supplied value isn't a valid media type, look it up
    if (mime.getExtension(mediaType) === null) {
      mediaType = mime.getType(mediaType) || mediaType
    }
  } else if (filePath) {
    // Try to determine the media type from the path
    mediaType = mime.getType(filePath)
  }

  if (mediaType) {
    // Get the compiler for the media type
    let compiler = compilerMap[mediaType]
    if (compiler) return compiler
  }

  if (filePath) {
    // No compiler found yet, so resort to sniffing the file path
    for (let compiler of compilerList) {
      if (compiler.sniff && (await compiler.sniff(filePath))) {
        return compiler
      }
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
    await resolve(filePath, mediaType)
    return true
  } catch (error) {
    return false
  }
}

export async function parse(
  file: VFile,
  filePath?: string,
  mediaType?: string
): Promise<Thing> {
  const compiler = await resolve(filePath, mediaType)
  return compiler.parse(file)
}

export async function unparse(
  thing: Thing,
  filePath?: string,
  mediaType?: string
): Promise<VFile> {
  const compiler = await resolve(filePath, mediaType)
  return compiler.unparse(thing, filePath)
}

export async function load(content: string, mediaType: string): Promise<Thing> {
  const file = vfile.load(content)
  return parse(file, undefined, mediaType)
}

export async function dump(thing: Thing, mediaType: string): Promise<string> {
  const file = await unparse(thing, undefined, mediaType)
  return vfile.dump(file)
}

export async function read(
  filePath?: string,
  mediaType?: string
): Promise<Thing> {
  let file
  if (filePath) file = await vfile.read(filePath)
  else file = vfile.load(await getStdin())
  return parse(file, filePath, mediaType)
}

export async function write(
  thing: Thing,
  filePath?: string,
  mediaType?: string
): Promise<void> {
  let file = await unparse(thing, filePath, mediaType)
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
  const thing = await read(inp, from)
  await write(thing, out, to)
}
