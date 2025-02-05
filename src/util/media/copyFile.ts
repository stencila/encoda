/**
 * @module util/media/copyFile
 */

import fs from 'fs-extra'
import path from 'path'

/**
 * Copy a file from one location to another.
 *
 * This function ensures that both the source file and
 * the destination folder exist before copying. Also
 * provides logging for unexpected conditions.
 */
export async function copyFile(from: string, to: string): Promise<void> {
  const exists = await fs.pathExists(from)
  if (!exists) {
    console.warn(`Source file does not exist, ignoring: ${from}`)
    return
  }
  if (from === to) {
    console.warn(`Destination is the same as source, ignoring: ${from}`)
    return
  }
  await fs.ensureDir(path.dirname(to))
  await fs.copyFile(from, to)
}
