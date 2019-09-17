/**
 * Utility functions for creating and reading Zip files
 *
 * @module util/zip
 */

import fs from 'fs-extra'
import JSZip from 'jszip'

/**
 * Create a Zip file
 *
 * @param zipPath The path to the zip archive
 * @param files A list of file paths to include in the zip archive
 * @param options
 * @param options.remove Remove files after creating the zip archive?
 */
export const create = async (
  zipPath: string,
  files: string[],
  options: { remove: boolean }
): Promise<string> => {
  const { remove = false } = options

  const zip = new JSZip()

  for (const file of files) {
    zip.file(file, fs.createReadStream(file))
  }

  return new Promise(resolve => {
    zip
      .generateNodeStream({ type: 'nodebuffer', streamFiles: true })
      .pipe(fs.createWriteStream(zipPath))
      .on('finish', () => {
        if (remove) {
          for (const file of files) fs.removeSync(file)
        }
        resolve(zipPath)
      })
  })
}
