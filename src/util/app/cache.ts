/**
 * A file cache based on [Keyv](https://github.com/lukechilds/keyv)
 * allowing for TTL (time to live) based expiry.
 *
 * Used by the `util/http` module for caching HTTP requests.
 *
 * @module util/app/cache
 */

import fs from 'fs-extra'
import Keyv from 'keyv'
import path from 'path'
import data from './data'

/**
 * Cache class that implements the methods required to
 * act as a Keyv storage adapter.
 */
class Cache implements Keyv.Store<string> {
  dir: string

  constructor(dir: string = path.join(data, 'cache')) {
    this.dir = dir
  }

  /**
   * Generates a valid file name, within the cache directory,
   * which excludes any characters that are invalid in file system paths.
   */
  filename(key: string): string {
    const filename = key.replace(/[<>:"\/\\|?*\x00-\x1F]/g, '!')
    return path.join(this.dir, filename)
  }

  async set(key: string, value: string): Promise<void> {
    fs.ensureDir(this.dir)
    fs.writeFile(this.filename(key), value, 'utf8')
  }

  async get(key: string): Promise<string | undefined> {
    try {
      return await fs.readFile(this.filename(key), 'utf8')
    } catch (error) {
      if (error.code === 'ENOENT') return undefined
      throw error
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      await fs.unlink(this.filename(key))
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
    }
    return true
  }

  async clear(): Promise<void> {
    await fs.remove(this.dir)
  }
}

const cache = new Cache()
export default cache
