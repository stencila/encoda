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
  options: { remove: boolean; dir: string }
): Promise<string> => {
  const { remove = false, dir = '' } = options

  const zip = new JSZip()

  for (const file of files) {
    let relativePath = file

    if (dir !== '') {
      let fullDir = dir
      if (!fullDir.endsWith('/')) fullDir += '/'
      if (file.startsWith(fullDir)) {
        relativePath = file.substring(fullDir.length)
      }
    }

    zip.file(relativePath, fs.createReadStream(file))
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
