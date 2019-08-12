import stencila from '@stencila/schema'
import { nodeType } from '@stencila/schema/dist/util'
import fs from 'fs-extra'
import { toMatchFile } from 'jest-file-snapshot'
import mime from 'mime'
import path from 'path'
import { Codec } from '../codecs/types'

/**
 * Add https://github.com/satya164/jest-file-snapshot
 *
 * > Jest matcher to write snapshots to a separate file instead of the
 * default snapshot file used by Jest. Writing a snapshot to a separate
 * file means you have proper syntax highlighting in the output file,
 * and better readability without those pesky escape characters.
 */
expect.extend({ toMatchFile })

/**
 * A Jest matcher for testing that a codec is able
 * to invert a node (ie. encode and then decode)
 * and produce useful error messages if it did not.
 *
 * @param codec The codec (passed by expect)
 * @param node The node to attempt to invert
 * @param name: The file name for any output files
 */
async function toInvert(codec: Codec, node: stencila.Node, fileName?: string) {
  if (!fileName) {
    const typeName = nodeType(node).toLowerCase()
    const num = Math.floor(Math.random() * Math.floor(1000))
    fileName = `${typeName}-${num}`
    const ext =
      (codec.extNames && codec.extNames[0]) ||
      (codec.mediaTypes && mime.getExtension(codec.mediaTypes[0]))
    if (ext) fileName += '.' + ext
  }
  const outPath = path.join(__dirname, '__outputs__', fileName)
  await fs.ensureDir(path.dirname(outPath))
  const file = await codec.encode(node, { filePath: outPath })
  const nodeDecoded = await codec.decode(file)
  try {
    expect(nodeDecoded).toEqual(node)
  } catch (error) {
    return {
      message: () => {
        let extra
        if (file.path)
          extra = `\n\nthe generated file was: ${path.relative(
            path.dirname(__dirname),
            file.path
          )}`
        else extra = `\n\nthe generated content was: ${file.contents}`
        return error.message + extra
      },
      pass: false
    }
  }
  // Clean up
  await fs.remove(outPath)
  return {
    message: () => 'ok!',
    pass: true
  }
}

expect.extend({ toInvert })

declare global {
  namespace jest {
    interface Matchers<R> {
      toInvert(node: stencila.Node, fileName?: string): R
    }
  }
}
