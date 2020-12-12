/**
 * @module util
 */

import { getLogger } from '@stencila/logga'
import fs from 'fs-extra'
import mime from 'mime'
import path from 'path'
import tempy from 'tempy'

const log = getLogger('encoda:util')

const DATA_URI_REGEX = /^data:([\w/+]+);(charset=[\w-]+|base64).*,(.*)/

/**
 * Test that a string is a Data URI
 *
 * @param str A string to test
 */
export function match(str: string): boolean {
  return DATA_URI_REGEX.test(str)
}

/**
 * Write a Data URI to file
 *
 * @param dataUri The data URI to write.
 * @param filePath The path of the file to write to (defaults to a temporary file)
 */
export async function toFile(
  dataUri: string,
  filePath?: string
): Promise<{ mediaType: string; filePath: string }> {
  const match = DATA_URI_REGEX.exec(dataUri)
  if (match === null) return { mediaType: '', filePath: '' }

  const mediaType = match[1]
  if (filePath === undefined) {
    const extension = mime.getExtension(mediaType) ?? 'png'
    filePath = tempy.file({ extension })
  }

  const data = dataUri.split(';base64,').pop()
  await fs.ensureDir(path.dirname(filePath))
  await fs.writeFile(filePath, data, 'base64')

  return { mediaType, filePath }
}

/**
 * Create a Data URI from file.
 *
 * @param filePath The file path to read.
 * @param mediaType The media type of the file (inferred from file extension if not provided)
 */
export async function fromFile(
  filePath: string,
  mediaType?: string
): Promise<{ mediaType: string; dataUri: string }> {
  if (mediaType === undefined) mediaType = mime.getType(filePath) ?? 'image/png'

  let data = ''
  try {
    data = await fs.readFile(filePath, 'base64')
  } catch (error) {
    if (error.code === 'ENOENT') {
      log.warn(`Image file does not exist, ignoring: ${filePath}`)
    } else {
      log.error(error)
    }
  }
  const dataUri = `data:${mediaType};base64,${data}`

  return { mediaType, dataUri }
}

/**
 * Create a Data URI from a JavaScript object.
 *
 * JSON stringifies and then base64 encodes the object.
 *
 * @param object The object to encode
 * @param mediaType The media type to encode into the Data URI
 */
export function fromJS(object: object, mediaType = 'application/json'): string {
  const json = JSON.stringify(object)
  const data = Buffer.from(json).toString('base64')
  return `data:${mediaType};base64,${data}`
}
