import stencila from '@stencila/schema'
import fs from 'fs-extra'
import getStdin from 'get-stdin'
import mime from 'mime'
import path from 'path'
import * as csv from './csv'
// import * as html from './html';
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
export const compilerList: Array<Compiler> = [
  //  gdoc,
  //  rpng,
  ods,
  tdp,
  xlsx,

  csv,
  // md,

  yaml,
  // html,
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
   * "flavors" of formats e.g. `datapackage.json` versus any old `.json` file.
   */
  fileNames?: Array<string>

  /**
   * Any array of file name extensions to register for the compiler.
   * This can be useful for specifying conversion to less well known media types
   * e.g. `--to tdp` for outputting `datapackage.json` to the console.
   */
  extNames?: Array<string>

  /**
   * A function that does [content sniffing](https://en.wikipedia.org/wiki/Content_sniffing)
   * to determine if the compiler is able to parse the content. As well as raw content, the content
   * string could be a file system path and the compiler could do "sniffing" of the file system
   * (e.g. testing if certain files are present in a directory).
   */
  sniff?: (content: string) => Promise<boolean>

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
 * Is a string a file system path?
 *
 * Several functions in this module allow for content to be passed as a
 * string of raw content (e.g. `This is some Markdown`) or as a file system
 * path. This function, assesses whether a file is a file system path or not.
 *
 * If the string starts with `/`, `./`, `../` (or Windows compatible backslash
 * equivalents as well as drive letter prefixed strings e.g. `C:\`)
 * then it is assumed to be a path but the presence of the path is not checked.
 * The reason for not checking presence
 * here is because "if the content looks like a path then the user probably meant
 * it to be a path". That is, if a user tries to convert the string "./file.md" then,
 * if that file doesn't exist, she probably wants the Markdown converter to give me an error
 * message. She probably doesn't want the `match` function to try and find some other converter
 * that acts on a plain strings.
 *
 * For all other strings, this function does check for presence, returning `true`
 * if the file exists.
 *
 * @param content The string to assess.
 */
export function isPath(content: string): boolean {
  if (/^(\/)|(\\)|([A-Z]:\\)|(\.(\/|\\))|(\.\.(\/|\\))/.test(content))
    return true
  if (fs.existsSync(content)) return true
  return false
}

/**
 * Match the compiler based on file name, extension name, media type or by content sniffing.
 *
 * Iterates through the list of compilers and returns the first that matches based on any
 * of the above criteria.
 *
 * If the supplied format contains a forward slash then it is assumed to be a media type,
 * otherwise an extension name.
 *
 * @param content The content as a file path (e.g. `../folder/file.txt`) or raw content
 * @param format The format as a media type (e.g. `text/plain`) or extension name (e.g. `txt`)
 * @returns A promise that resolves to the `Compiler` to use
 */
export async function match(
  content?: string,
  format?: string
): Promise<Compiler> {
  // Resolve variables used to match a compiler...
  let fileName
  let extName
  let mediaType
  // If the content is a path then begin with derived values
  if (content && isPath(content)) {
    fileName = path.basename(content)
    extName = path.extname(content).slice(1)
    mediaType = mime.getType(content) || undefined
  }
  // But override with supplied format (if any) assuming that
  // media types always have a forward slash and extension names
  // never do.
  if (format) {
    if (format.includes('/')) mediaType = format
    else {
      extName = format
      mediaType = mime.getType(extName) || undefined
    }
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

    if (content && compiler.sniff && (await compiler.sniff(content))) {
      return compiler
    }
  }

  let message = 'No compiler could be found'
  if (content) message += ` for content "${content}"`
  if (format) message += ` for format "${format}"`
  message += '.'
  throw new Error(message)
}

/**
 * Is the file path, or media type handled? (i.e. is there a compiler for it?)
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
 * Parse a virtual file to a `stencila.Node`
 *
 * @param file The `VFile` to parse
 * @param content The file path
 * @param format The media type
 */
export async function parse(
  file: VFile,
  content?: string,
  format?: string
): Promise<stencila.Node> {
  const compiler = await match(content, format)
  return compiler.parse(file)
}

/**
 * Unparse (i.e. serialize) a `stencila.Node` to a virtual file.
 *
 * @param node The node to unparse
 * @param filePath The file path to unparse the node to.
 *                 Only required for some compilers e.g. those unparsing to more than one file.
 * @param format The format to unparse the node as.
 *               If undefined then determined from filePath or file path.
 */
export async function unparse(
  node: stencila.Node,
  filePath?: string,
  format?: string
): Promise<VFile> {
  const compiler = await match(filePath, format)
  return compiler.unparse(node, filePath)
}

/**
 * Load a `stencila.Node` from a string of content.
 *
 * @param content The content to load.
 * @param format The format to load the content as.
 */
export async function load(
  content: string,
  format: string
): Promise<stencila.Node> {
  const file = vfile.load(content)
  return parse(file, undefined, format)
}

/**
 * Dump a `stencila.Node` to a string of content.
 *
 * @param node The node to dump.
 * @param format The format to dump the node as.
 */
export async function dump(
  node: stencila.Node,
  format: string
): Promise<string> {
  const file = await unparse(node, undefined, format)
  return vfile.dump(file)
}

/**
 * Read a file to a `stencila.Node`.
 *
 * @param content The raw content or file path to read.
 *                If undefined then read from standard input.
 * @param format The format to read the file as.
 *               If undefined then determined from content or file path.
 */
export async function read(
  content?: string,
  format?: string
): Promise<stencila.Node> {
  let file
  if (content && isPath(content)) {
    file = await vfile.read(content)
  } else {
    if (!content) content = await getStdin()
    file = vfile.load(content)
  }
  return parse(file, content, format)
}

/**
 * Write a `stencila.Node` to a file.
 *
 * @param node The node to write.
 * @param filePath The file system path to write to.
 *                 If undefined then write to standard output.
 * @param format The format to write the node as.
 */
export async function write(
  node: stencila.Node,
  filePath?: string,
  format?: string
): Promise<void> {
  let file = await unparse(node, filePath, format)
  if (!filePath) console.log(vfile.dump(file))
  else await vfile.write(file, filePath)
}

/**
 * Convert content from one format to another.
 *
 * @param inp The input content (raw or file path). If undefined, standard input is used.
 * @param out The output file path. If missing standard output is used.
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
