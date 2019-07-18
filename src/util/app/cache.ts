/**
 * A file cache based on [Keyv](https://github.com/lukechilds/keyv)
 * allowing for TTL (time to live) based expiry.
 *
 * Used by the `util/http` module for caching HTTP requests.
 *
 * @module util/app/cache
 */

import AsyncLock from 'async-lock'
import fs from 'fs-extra'
import Keyv from 'keyv'
import path from 'path'
import data from './data'

/**
 * Lock to prevent races among
 * asynchronous calls. e.g. `get` before
 * `set` has finished writing file.
 */
const lock = new AsyncLock()

/**
 * Cache class that implements the methods required to
 * act as a Keyv storage adapter.
 */
export class Cache implements Keyv.Store<string> {
  /**
   * The directory for the cache files.
   * Defaults to `cache` in the this apps data directory.
   */
  private dir: string

  public constructor(dir: string = path.join(data, 'cache')) {
    this.dir = dir
  }

  /**
   * Generates a valid file name, within the cache directory,
   * which excludes any characters that are invalid in file system paths.
   */
  private filename(key: string): string {
    const filename = key.replace(/[<>:"/\\|?*]/g, '!')
    return path.join(this.dir, filename)
  }

  /**
   * Set a value to be cached.
   */
  public async set(key: string, value: string): Promise<void> {
    await lock.acquire('dir', async () => fs.ensureDir(this.dir))

    const filename = this.filename(key)
    return lock.acquire(filename, async () => {
      await fs.writeFile(filename, value, 'utf8')
    })
  }

  /**
   * Get a value from the cache.
   */
  public async get(key: string): Promise<string | undefined> {
    const filename = this.filename(key)
    return lock.acquire(filename, async () => {
      try {
        const value = await fs.readFile(filename, 'utf8')
        return value
      } catch (error) {
        if (error.code === 'ENOENT') return undefined
        throw error
      }
    })
  }

  /**
   * Delete a value from the cache.
   */
  public async delete(key: string): Promise<boolean> {
    const filename = this.filename(key)
    return lock.acquire(filename, async () => {
      try {
        await fs.unlink(filename)
      } catch (error) {
        if (error.code !== 'ENOENT') throw error
      }
      return true
    })
  }

  /**
   * Clear the cache completely.
   */
  public async clear(): Promise<void> {
    return lock.acquire('dir', async () => fs.remove(this.dir))
  }
}

const cache = new Cache()
export default cache
