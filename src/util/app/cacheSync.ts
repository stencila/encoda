/**
 * This is a synchronous version of the asynchronous file cache
 * in `./cache`. Unfortunately the `async` version does not
 * seem to play nicely with `got` and/or `cachable-request`
 * when used in the `./https.ts` module.
 *
 * @module util/app/cacheSync
 */

import fs from 'fs-extra'
import Keyv from 'keyv'
import path from 'path'
import data from './data'

/**
 * Cache class that implements the methods required to
 * act as a Keyv storage adapter.
 */
export class CacheSync implements Keyv.Store<string> {
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
  public set(key: string, value: string): void {
    fs.ensureDirSync(this.dir)
    fs.writeFileSync(this.filename(key), value, 'utf8')
  }

  /**
   * Get a value from the cache.
   */
  public get(key: string): string | undefined {
    try {
      return fs.readFileSync(this.filename(key), 'utf8')
    } catch (error) {
      if (error.code === 'ENOENT') return undefined
      throw error
    }
  }

  /**
   * Delete a value from the cache.
   */
  public delete(key: string): boolean {
    try {
      fs.unlinkSync(this.filename(key))
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
    }
    return true
  }

  /**
   * Clear the cache completely.
   */
  public clear(): void {
    return fs.removeSync(this.dir)
  }
}

const cache = new CacheSync()
export default cache
