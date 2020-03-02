import stencila from '@stencila/schema'
import '@testing-library/jest-dom/extend-expect'
import fs from 'fs-extra'
import diff from 'jest-diff'
import { toMatchFile } from 'jest-file-snapshot'
import { matcherHint, printExpected, printReceived } from 'jest-matcher-utils'
import mime from 'mime'
import path from 'path'
import { Codec } from '../codecs/types'

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
    const typeName = stencila.nodeType(node).toLowerCase()
    const num = Math.floor(Math.random() * Math.floor(1000))
    fileName = `${typeName}-${num}`
    const ext =
      (codec.extNames && codec.extNames[0]) ||
      (codec.mediaTypes && mime.getExtension(codec.mediaTypes[0]))
    if (ext) fileName += '.' + ext
  }
  const outPath = path.join(__dirname, '__outputs__', fileName)
  await fs.ensureDir(path.dirname(outPath))
  const file = await codec.encode(node, {
    filePath: outPath
  })
  const nodeDecoded = await codec.decode(file)
  try {
    expect(nodeDecoded).toEqual(node)
  } catch (error) {
    return {
      message: () => {
        let extra
        if (file.path)
          extra = `\n\nthe generated file was: ${path.relative(
            path.dirname(path.dirname(__dirname)),
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

const stripWhitespace = (s: string) =>
  s
    .replace(/>\s+</g, `><`)
    .replace(/\s+/g, ` `)
    .replace(/\s+\<\//g, '</')
    .replace(/\>\s+/g, '>')

/**
 * Compares text values disregarding whitespace differences (including newlines).
 * based on https://stackoverflow.com/a/48459005
 */
const toEqualStringContent = (
  received: string,
  expected: string,
  printOriginalValues?: boolean
) => {
  const compressedExpected = stripWhitespace(expected)
  const compressedReceived = stripWhitespace(received)
  const pass = compressedExpected === compressedReceived

  if (pass) {
    return {
      message: () =>
        (printOriginalValues
          ? `Uncompressed expected value:\n` + `  ${printExpected(expected)}\n`
          : '') +
        `Expected value with compressed whitespace to not equal:\n` +
        `  ${printExpected(compressedExpected)}\n` +
        (printOriginalValues
          ? `Uncompressed received value:\n` + `  ${printReceived(received)}\n`
          : '') +
        `Received value with compressed whitespace:\n` +
        `  ${printReceived(compressedReceived)}`,
      pass: true
    }
  } else {
    return {
      message: () => {
        // `expected ${received} to match string ${expected}`,
        const diffString = diff(compressedExpected, compressedReceived, {
          expand: true
        })

        return (
          `${matcherHint(`.${toEqualStringContent}`)}\n\n` +
          (printOriginalValues
            ? `Uncompressed expected value:\n` +
              `  ${printExpected(expected)}\n`
            : '') +
          `Expected value with compressed whitespace to equal:\n` +
          `  ${printExpected(compressedExpected)}\n` +
          (printOriginalValues
            ? `Uncompressed received value:\n` +
              `  ${printReceived(received)}\n`
            : '') +
          `Received value with compressed whitespace:\n` +
          `  ${printReceived(compressedReceived)}${
            diffString ? `\n\nDifference:\n\n${diffString}` : ``
          }`
        )
      },
      pass: false
    }
  }
}

/**
 * Add https://github.com/satya164/jest-file-snapshot
 *
 * > Jest matcher to write snapshots to a separate file instead of the
 * default snapshot file used by Jest. Writing a snapshot to a separate
 * file means you have proper syntax highlighting in the output file,
 * and better readability without those pesky escape characters.
 */
expect.extend({ toInvert, toMatchFile, toEqualStringContent })

declare global {
  namespace jest {
    interface Matchers<R, T> {
      toInvert(node: stencila.Node, fileName?: string): R

      /**
       * Compares text values disregarding whitespace differences (including newlines).
       */
      toEqualStringContent(expected: string, printOriginalValues?: boolean): R
    }
  }
}
