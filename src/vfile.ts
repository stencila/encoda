import vfile, { VFile } from 'vfile'
// @ts-ignore
import toVFile from 'to-vfile'

/**
 * Create a virtual file
 *
 * @param options to `vfile` see https://github.com/vfile/vfile#vfileoptions
 */
export function create (options: any = {}): VFile {
  return vfile(options)
}

/**
 * Load a string into a virtual file
 *
 * @param contents Contents to load
 */
export function load (contents: string): VFile {
  return vfile({ contents })
}

/**
 * Dump a string from the contents of a virtual files
 *
 * @param file The virtual file to dump
 */
export function dump (vfile: VFile): string {
  return vfile.contents ? vfile.contents.toString() : ''
}

/**
 * Read a file path into a virtual file
 *
 * @param path File system path to read
 */
export async function read (path: string): Promise<VFile> {
  return toVFile.read(path)
}

/**
 * Write a virtual file to the file system
 *
 * @param vfile Virtual file to write
 */
export async function write (vfile: VFile): Promise<any> {
  return toVFile.write(vfile)
}
