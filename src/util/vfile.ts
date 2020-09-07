/**
 * @module util/vfile
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

import fs from 'fs-extra'
import path from 'path'
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
  options: vfile.VFileOptions = {}
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
export function load(
  contents: VFileContents,
  options: vfile.VFileOptions = {}
): VFile {
  return vfile({ ...options, contents })
}

/**
 * Dump a string from the contents of a virtual files
 *
 * If the file has no `contents` but does have a file
 * `path`, then `read` the virtual file.
 *
 * @param file The virtual file to dump
 */
// Not supported by eslint, worksaround doesn't work
// See https://github.com/benmosher/eslint-plugin-import/issues/1357
// eslint-disable-next-line
export async function dump(vfile: VFile, mode?: 'string'): Promise<string>
// eslint-disable-next-line
export async function dump(vfile: VFile, mode?: 'buffer'): Promise<Buffer>
// eslint-disable-next-line
export async function dump(
  vfile: VFile,
  mode: 'string' | 'buffer' = 'string'
): Promise<string | Buffer> {
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
  return mode === 'string' ? '' : Buffer.alloc(0)
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
 * @param filePath The file system path to write to, or `-` to write to stdout.
 */
export async function write(vfile: VFile, filePath: string): Promise<void> {
  if (!filePath) throw new Error('Argument `filePath` is required')

  if (filePath === '-') {
    console.log(await dump(vfile))
  } else if (filePath && vfile.contents) {
    await fs.ensureDir(path.dirname(filePath))
    vfile.path = filePath
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
export function isPath(content: string): boolean {
  if (/^(\/)|(\\)|([A-Z]:\\)|(\.(\/|\\))|(\.\.(\/|\\))/.test(content)) {
    return true
  }
  if (fs.existsSync(content)) return true
  return false
}
