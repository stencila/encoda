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
import cache from './app/cache'

const pipeline = util.promisify(stream.pipeline)

const http = got.extend({
  cache,
  headers: {
    'user-agent': `encoda (https://github.com/stencila/encoda)`,
    'accept-encoding': 'gzip, deflate'
  }
})

/**
 * Get content from a URL
 *
 * @param url The URL to get
 * @param options Options to pass to `got`
 */
export async function get(
  url: string,
  options = {}
): Promise<got.Response<string>> {
  return http.get(url, options)
}

/**
 * Download a file
 *
 * @param url The URL to download from
 * @param filePath The file path to download to
 */
export async function download(url: string, filePath: string): Promise<void> {
  return pipeline(http.stream(url), fs.createWriteStream(filePath))
}

/**
 * Clear any cached content for a particular URL
 *
 * @param url The URL to clear the cache for
 */
export async function cacheDelete(url: string): Promise<boolean> {
  return cache.delete('cacheable-request:GET:' + url)
}
