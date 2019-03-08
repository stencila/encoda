// @ts-ignore
import mime from 'mime-types'
import { VFile } from 'vfile'

import { Node } from './sast'

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
  sniff?: (file: VFile) => Promise<boolean>

  /**
   * Parse the content of a `Vfile` into a tree of Stencila
   * document nodes
   * 
   * @param file The `VFile` to parse
   * @returns The root of the document
   */
  parse?: (file: VFile) => Promise<Node>

  /**
   * Unparse a Stencila document node to a `VFile`.
   * 
   * @param node The document node to unparse
   * @returns The `VFile` with generated `contents`
   */
  unparse?: (node: Node) => Promise<VFile>
}


/**
 * A list of all compilers.
 * 
 * Note that order is of importance when the media type of 
 * a `VFile` can not be determined since the first compiler
 * which returns `true` when `sniff`ing the file will be
 * used to parse it.
 */
const compilers: Array<Compiler> = []

/**
 * A map of media types to compiler.
 * 
 * Used for first attempt at revolving the compiler
 * to use to parse/unparse from/to a `VFile`.
 */
const lookup: {[key: string]: Compiler} = {}
for (let compiler of compilers) {
  for (let medium of compiler.media) {
    lookup[medium] = compiler
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
export async function resolve (file: VFile): Promise<Compiler> {
  let mediaType = (file as any).mediaType
  
  if (!mediaType && file.extname) {
    mediaType = mime.lookup(file.extname)
  }

  if (mediaType) {
    let compiler = lookup[mediaType]
    if (compiler) return compiler
  }

  for (let compiler of compilers) {
    if (compiler.sniff && await compiler.sniff(file)) {
      return compiler
    }
  }

  throw new Error(`No compiler could be found for file ${file.path}`)
}

export async function parse (file: VFile): Promise<Node> {
  const compiler = await resolve(file)
  if (!compiler.parse) throw new Error(`Not able to parse`)
  return await compiler.parse(file)
}

export async function unparse (node: Node, file: VFile): Promise<VFile> {
  const compiler = await resolve(file)
  if (!compiler.unparse) throw new Error(`Not able to unparse`)
  return await compiler.unparse(node)
}
