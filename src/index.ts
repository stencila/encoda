import getStdin from 'get-stdin'
// @ts-ignore
import mime from 'mime-types'
import path from 'path'
import { VFile } from 'vfile'

import { Node } from './sast'
import * as vfile from './vfile'

import * as csv from './csv'
import * as json from './json'
import * as gdoc from './gdoc'
import * as html from './html'
import * as md from './md'
import * as ods from './ods'
import * as rpng from './rpng'
import * as yaml from './yaml'
import * as xlsx from './xlsx'
import { file } from '@babel/types'

/**
 * A list of all compilers.
 *
 * Note that order is of importance when the media type of
 * a `VFile` can not be determined since the first compiler
 * which returns `true` when `sniff`ing the file will be
 * used to parse it.
 */
const compilers: Array<Compiler> = [
  // Binary formats for which sniffing may help resolve media type
  ods,
  rpng,
  xlsx,

  // Text formats
  html,

  // Text formats for which sniffing will not help resolve media type (much)
  md,
  csv,
  gdoc,
  json,
  yaml
]

/**
 * The interface for a compiler.
 *
 * A compiler is simply a module with these constants
 * and functions (some of which are optional).
 *
 * Note that our use of the term "compiler", is consistent with our usage elsewhere in Stencila
 * as something that creates or modifies executable document, and
 * differs from that used by [`unified`](https://github.com/unifiedjs/unified#processorcompiler).
 */
interface Compiler {
  /**
   * An array of [IANA Media Type](https://www.iana.org/assignments/media-types/media-types.xhtml)
   * that the compiler can parse/unparse
   */
  media: Array<string>

  /**
   * A function that does [content sniffing](https://en.wikipedia.org/wiki/Content_sniffing)
   * of the `VFile` to determine if the compiler is able to parse the content.
   */
  sniff?: (filePath: string) => Promise<boolean>

  /**
   * Parse the content of a `Vfile` into a tree of Stencila
   * document nodes.
   *
   * @param file The `VFile` to parse
   */
  parse: (file: VFile) => Promise<Node>

  /**
   * Unparse a Stencila document node to a `VFile`.
   *
   * @param node The document node to unparse
   * @param file The `VFile` to unparse to
   */
  unparse: (node: Node, filePath?: string) => Promise<VFile>
}

/**
 * A map of media types to compiler.
 *
 * Used for first attempt at revolving the compiler
 * to use to parse/unparse from/to a `VFile`.
 */
const mediaTypes: { [key: string]: Compiler } = {}
for (let compiler of compilers) {
  for (let medium of compiler.media) {
    mediaTypes[medium] = compiler
  }
}

/**
 * Resolve the compiler to use to parse/unparse from/to a `VFile`.
 *
 * Resolution is attempted on the basis of `media` types first and then, if that
 * fails, using the `sniff()` function.
 *
 * @param file The `VFile` to resolve for
 * @returns The `Compiler` to use
 */
export async function resolve(
  filePath?: string,
  mediaType?: string
): Promise<Compiler> {
  if (!mediaType && filePath) {
    mediaType = mime.lookup(path)
  }

  if (mediaType) {
    let compiler = mediaTypes[mediaType]
    if (compiler) return compiler
  }

  if (filePath) {
    let compiler = mediaTypes[path.extname(filePath).slice(1)]
    if (compiler) return compiler

    for (let compiler of compilers) {
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
): Promise<Node> {
  const compiler = await resolve(filePath, mediaType)
  return compiler.parse(file)
}

export async function unparse(
  node: Node,
  filePath?: string,
  mediaType?: string
): Promise<VFile> {
  const compiler = await resolve(filePath, mediaType)
  return compiler.unparse(node, filePath)
}

export async function load(content: string, mediaType: string): Promise<Node> {
  const file = vfile.load(content)
  return parse(file, undefined, mediaType)
}

export async function dump(node: Node, mediaType: string): Promise<string> {
  const file = await unparse(node, undefined, mediaType)
  return vfile.dump(file)
}

export async function read(
  filePath?: string,
  mediaType?: string
): Promise<Node> {
  let file
  if (filePath) file = await vfile.read(filePath)
  else file = vfile.load(await getStdin())
  return parse(file, filePath, mediaType)
}

export async function write(
  node: Node,
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
