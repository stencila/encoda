/**
 * A utility module for HTTP requests
 *
 * Uses `got` to enable RFC 7234 compliant HTTP caching
 *
 * @module util/http
 */

import fs from 'fs-extra'
import got from 'got'
import stream from 'stream'
import util from 'util'

const pipeline = util.promisify(stream.pipeline)

// TODO: Enable disk-based caching
const cache = new Map()

const http = got.extend({
  cache
})

/**
 * Get content from a URL
 *
 * @param url The URL to get
 * @param options Options to pass to `got`
 */
export async function get(url: string, options = {}) {
  return await http.get(url, options)
}

/**
 * Download a file
 *
 * @param url The URL to download from
 * @param filePath The file path to download to
 */
export async function download(url: string, filePath: string) {
  return pipeline(http.stream(url), fs.createWriteStream(filePath))
}
