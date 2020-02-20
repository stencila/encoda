/**
 * @module rpng
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

import * as stencila from '@stencila/schema'
import fs from 'fs-extra'
import path from 'path'
import pngText from 'png-chunk-text'
import pngEncode from 'png-chunks-encode'
import pngExtract, { Chunk } from 'png-chunks-extract'
// Node.js built-in punycore is deprecated.
// However, if we add a trailing slash below to import the userland version as suggested at
// https://github.com/mysticatea/eslint-plugin-node/blob/master/docs/rules/no-deprecated-api.md
// `pkg` has problems resolving the module. So instead we ignore eslint complaint:
// eslint-disable-next-line node/no-deprecated-api
import punycode from 'punycode'
import { dump } from '../../index'
import * as puppeteer from '../../util/puppeteer'
import * as vfile from '../../util/vfile'
import { Codec, CommonEncodeOptions } from '../types'

/**
 * Styling to be applied to a node's HTML fragment
 * when generating the rPNG.
 *
 * This is decoupled from any themes because rPNGs are usually
 * used in a context where themes do not apply e.g. in a `docx` file.
 *
 * Currently, rather than try to do some fancy CSS module loading,
 * we just copy and paste this file in here.
 */
const encodeCss = `
:root {
  /* --color-neutral: ; */
  --color-neutral-100: #f7fafc;
  --color-neutral-300: #e2e8f0;
}

#target {
  display: inline-block;
  font-family: monospace;
  font-size: 11pt;
  line-height: 150%;
  color: #333;
  padding: 1px;
}

stencila-code-chunk,
stencila-code-expression {
  display: inline-block;
  background: var(--color-neutral-100);
  border: 1px solid var(--color-neutral-300);
  border-radius: 0.25rem;
}

stencila-code-chunk,
stencila-code-expression {
  min-width: 1em;
  min-height: 1em;
}

stencila-code-chunk [slot='text'],
stencila-code-expression [slot='text'] {
  display: none;
}

stencila-code-chunk [slot='outputs'] {
  margin: 1em;
}

stencila-code-chunk [slot='outputs'] * {
  margin: 1em auto;
}

stencila-code-chunk::before,
stencila-code-expression::before {
  content: 'code';
  color: transparent;
  height: 2em;
  position: relative;
  left: 0.5em;
  font-size: 0.8rem;
  line-height: 1.5;
  text-transform: uppercase;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='rgb(29, 100, 243)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='feather feather-code'%3E%3Cpolyline points='16 18 22 12 16 6'/%3E%3Cpolyline points='8 6 2 12 8 18'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-size: contain;
}

stencila-code-chunk::before {
  top: 0.5em;
  left: 1em;
  padding-right: 0.5rem;
}

stencila-code-expression [slot='output'] {
  display: inline-block;
  margin: 0.1em 0.5em 0.1em auto;
}

table {
  border: 1px solid grey;
  border-collapse: collapse;
}

table th {
  color: #555;
  background: rgba(0, 0, 0, 0.1);
}

table th,
table td {
  padding: 0.5em;
  border: 1px solid lightgrey;
}
`

/**
 * The keyword to use for the PNG chunk containing the JSON
 */
const KEYWORD = 'JSON'

export class RPNGCodec extends Codec implements Codec {
  // A vendor media type similar to https://www.iana.org/assignments/media-types/image/vnd.mozilla.apng
  public readonly mediaTypes = ['vnd.stencila.rpng']

  public readonly extNames = ['rpng']

  /**
   * Sniff a PNG file to see if it is an rPNG
   *
   * @param content The content to sniff (a file path)
   */
  public readonly sniff = async (content: string): Promise<boolean> => {
    if (path.extname(content) === '.png') {
      if (await fs.pathExists(content)) {
        const contents = await fs.readFile(content)
        return has(KEYWORD, contents)
      }
    }
    return false
  }

  /**
   * Synchronous version of `sniff()`.
   *
   * @see sniff
   *
   * @param content The content to sniff (a file path)
   */
  public sniffSync = (content: string): boolean => {
    if (path.extname(content) === '.png') {
      if (fs.existsSync(content)) {
        const contents = fs.readFileSync(content)
        return has(KEYWORD, contents)
      }
    }
    return false
  }

  /**
   * Decode a rPNG to a Stencila node.
   *
   * This is done by extracting the JSON
   * from the `tEXt` chunk and parsing it.
   *
   * @param file The `VFile` to decode
   * @returns The Stencila node
   */
  public readonly decode = async (
    file: vfile.VFile
  ): Promise<stencila.Node> => {
    const buffer = await vfile.dump(file, 'buffer')
    return this.decodeSync(buffer)
  }

  /**
   * Synchronous version of `decode()`.
   *
   * @see decode
   *
   * @param content The content to sniff (a file path).
   */
  public decodeSync = (buffer: Buffer): stencila.Node => {
    const json = extract(KEYWORD, buffer)
    return JSON.parse(json)
  }

  /**
   * Sniff and decode a file if it is a rPNG.
   *
   * This function is like combining `sniffSync()` and `decodeSync()`
   * but is faster because it only reads the file contents once.
   *
   * @param filePath The file path to sniff.
   */
  public sniffDecodeSync = (filePath: string): stencila.Node | undefined => {
    if (path.extname(filePath) === '.png') {
      if (fs.existsSync(filePath)) {
        const image = fs.readFileSync(filePath)
        const chunks: Chunk[] = pngExtract(image)
        const [h, json] = find(KEYWORD, chunks)
        if (json) return JSON.parse(json)
      }
    }
  }

  /**
   * Encode a Stencila node to a rPNG.
   *
   * This is done by dumping the node to HTML,
   * "screen-shotting" the HTML to a PNG and then inserting the
   * node's JSON into the image's `tEXt` chunk.
   *
   * When used with `isStandalone === true` will create a "thumbnail"
   * of the entire node (e.g. article, dataset) with whatever theme is specified.
   *
   * @param node The Stencila node to encode
   * @param options Object containing settings for the encoder.
   */
  public readonly encode = async (
    node: stencila.Node,
    options: CommonEncodeOptions = this.commonEncodeDefaults
  ): Promise<vfile.VFile> => {
    // isStandalone defaults to false because usually we are generating
    // rPNGs to be embedded in other files e.g. rDOCX
    const { filePath, isStandalone = false } = options

    // Generate HTML for the node.
    // Bundle because Puppeteer will not load local (e.g. `/tmp`) files
    // Other options e.g. themes are passed through
    const nodeHtml = await dump(node, 'html', {
      ...options,
      isStandalone,
      isBundle: true
    })

    // If generating an rPNG for a HTML fragment wrap it to be able to
    // apply some basic styling e.g. padding
    const pageHtml = isStandalone
      ? nodeHtml
      : `<div id="target">${nodeHtml}</div>`

    const page = await puppeteer.page()
    await page.setContent(pageHtml, { waitUntil: 'networkidle0' })

    let buffer
    if (isStandalone) {
      buffer = await page.screenshot({
        encoding: 'binary',
        fullPage: true
      })
    } else {
      await page.addStyleTag({ content: encodeCss })
      const elem = await page.$('#target')
      if (!elem)
        throw new Error('Woaaaah, this should never happen! Element not found!')
      buffer = await elem.screenshot({
        encoding: 'binary'
      })
    }

    await page.close()

    // Insert the Stencila node as JSON into a `tEXt` chunk
    const json = JSON.stringify(node)
    const image = insert(KEYWORD, json, buffer)

    // Save to file
    const file = vfile.load(image)
    if (filePath) {
      file.path = filePath
      await vfile.write(file, filePath)
    }

    return file
  }
}

/**
 * Find a text chunk in an image
 *
 * @param keyword The keyword for the text chunk
 * @param chunks The image chunks to search through
 */
export function find(
  keyword: string,
  chunks: Chunk[]
): [number, string | undefined] {
  let index = 0
  for (const chunk of chunks) {
    if (chunk.name === 'tEXt') {
      const entry = pngText.decode(chunk.data)
      if (entry.keyword === keyword) {
        return [index, punycode.decode(entry.text)]
      }
    }
    index += 1
  }
  return [-1, undefined]
}

/**
 * Does an image have a text chunk with the given keyword?
 *
 * @param keyword The keyword for the text chunk
 * @param image The image `Buffer`
 */
export function has(keyword: string, image: Buffer): boolean {
  const chunks: Chunk[] = pngExtract(image)
  const [h, text] = find(keyword, chunks)
  return !!text
}

/**
 * Extract a text chunk from an image
 *
 * @param keyword The keyword for the text chunk
 * @param image The image `Buffer`
 */
export function extract(keyword: string, image: Buffer): string {
  const chunks: Chunk[] = pngExtract(image)
  const [h, text] = find(keyword, chunks)
  if (!text) throw Error('No chunk found')
  return text
}

/**
 * Insert a text chunk into an image
 *
 * @param keyword The keyword for the text chunk
 * @param text The text to insert
 * @param image The image to insert into
 */
export function insert(keyword: string, text: string, image: Buffer): Buffer {
  const chunks: Chunk[] = pngExtract(image)
  const [index, current] = find(keyword, chunks)
  if (current) chunks.splice(index, 1)
  const chunk = pngText.encode(keyword, punycode.encode(text))
  chunks.splice(-1, 0, chunk)
  return Buffer.from(pngEncode(chunks))
}
