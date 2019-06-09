import fs from 'fs-extra'
import mime from 'mime'
import tempy from 'tempy'

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
  const match = dataUri.match(
    /^data:([\w\/\+]+);(charset=[\w-]+|base64).*,(.*)/
  )
  if (!match) return { mediaType: '', filePath: '' }

  const mediaType = match[1]
  if (!filePath) {
    const extension = mime.getExtension(mediaType) || 'png'
    filePath = tempy.file({ extension })
  }

  const data = dataUri.split(';base64,').pop()
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
  if (!mediaType) mediaType = mime.getType(filePath) || 'image/png'

  const data = await fs.readFile(filePath, 'base64')
  const dataUri = `data:${mediaType};base64,${data}`

  return { mediaType, dataUri }
}
