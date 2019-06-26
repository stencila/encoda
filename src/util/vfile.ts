import fs from 'fs-extra'
import getStdin from 'get-stdin'
// @ts-ignore
import toVFile from 'to-vfile'
import vfile, { VFileContents } from 'vfile'

/**
 * The virtual file type
 */
export type VFile = vfile.VFile

/**
 * Create a virtual file
 *
 * @param contents Raw string contents of `VFile`, or file path
 * @param options Options to `vfile` see https://github.com/vfile/vfile#vfileoptions
 */
export function create(
  contents?: string,
  options: { [key: string]: any } = {}
): VFile {
  if (contents) {
    if (isPath(contents)) options = { ...options, path: contents }
    else options = { ...options, contents }
  }
  return vfile(options)
}

/**
 * Load a string into a virtual file
 *
 * @param contents Contents to load
 */
export function load(contents: VFileContents): VFile {
  return vfile({ contents })
}

/**
 * Dump a string from the contents of a virtual files
 *
 * If the file has no `contents` but does have a file
 * `path`, then `read` the virtual file.
 *
 * @param file The virtual file to dump
 */
export async function dump(vfile: VFile, mode?: 'string'): Promise<string>
export async function dump(vfile: VFile, mode?: 'buffer'): Promise<Buffer>
export async function dump(
  vfile: VFile,
  mode?: 'string' | 'buffer'
): Promise<string | Buffer> {
  mode = mode || 'string'
  if (vfile.contents) {
    if (mode === 'string') return vfile.toString()
    else
      return Buffer.isBuffer(vfile.contents)
        ? vfile.contents
        : Buffer.from(vfile.contents)
  }
  if (vfile.path) {
    const readFile = await toVFile.read(vfile.path)
    return mode === 'string' ? readFile.toString() : readFile.contents
  }
  return mode === 'string' ? '' : new Buffer(0)
}

/**
 * Read a file path into a virtual file
 *
 * @param path The content, or file system path to read from. If `-`, read from stdin.
 */
export async function read(content: string): Promise<VFile> {
  if (!content) throw new Error('Argument `path` is required')

  if (content === '-') {
    return load(await getStdin())
  } else if (isPath(content)) {
    return toVFile.read(content)
  } else {
    return load(content)
  }
}

/**
 * Write a virtual file to the file system or standard output.
 *
 * Will never write an empty file i.e. will only write if the
 * `vfile` has `contents`.
 *
 * @param vfile Virtual file to write
 * @param path The file system path to write to, or `-` to write to stdout.
 */
export async function write(vfile: VFile, path: string): Promise<void> {
  if (!path) throw new Error('Argument `path` is required')

  if (path === '-') {
    console.log(await dump(vfile))
  } else if (path && vfile.contents) {
    vfile.path = path
    await toVFile.write(vfile)
  }
}

/**
 * Is a string a file system path?
 *
 * Several functions in this module allow for content to be passed as a
 * string of raw content (e.g. `This is some Markdown`) or as a file system
 * path. This function, assesses whether a file is a file system path or not.
 *
 * If the string starts with `/`, `./`, `../` (or Windows compatible backslash
 * equivalents as well as drive letter prefixed strings e.g. `C:\`),
 * or has a 1-5 character extension,
 * then it is assumed to be a path but the presence of the path is not checked.
 * The reason for not checking presence
 * here is because "if the content looks like a path then the user probably meant
 * it to be a path". That is, if a user tries to convert the string "./file.md" then,
 * if that file doesn't exist, they probably want the Markdown converter to give me an error
 * message. They probably don't want the `match` function to try and find some other converter
 * that acts on a plain strings.
 *
 * For all other strings, this function does check for presence, returning `true`
 * if the file exists.
 *
 * @param content The string to assess.
 */
export function isPath(content: string, isOutput: boolean = false): boolean {
  if (/^(\/)|(\\)|([A-Z]:\\)|(\.(\/|\\))|(\.\.(\/|\\))/.test(content)) {
    return true
  }
  if (/.+\.\w{1,5}$/.test(content)) return true
  if (fs.existsSync(content)) return true
  return false
}
