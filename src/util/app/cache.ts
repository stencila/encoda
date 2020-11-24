import crypto from 'crypto'
import fs from 'fs-extra'
import Keyv from 'keyv'
import path from 'path'
import tempy from 'tempy'

/**
 * Cache class that implements the methods required to
 * act as a Keyv storage adapter.
 *
 * For a previous attempt an an async store see
 * https://github.com/stencila/encoda/blob/bbad58784e7af4d64fca73eb02568e750f5bbcf8/src/util/app/cache.ts
 */
export class Cache implements Keyv.Store<string> {
  /**
   * The directory for the cache files.
   */
  private dir: string

  public constructor() {
    this.dir = tempy.directory({ prefix: 'encoda' })
    fs.ensureDirSync(this.dir)
  }

  /**
   * Generates a file name within the cache directory.
   *
   * Use a hash to avoid invalid characters and names
   * that are too long. Use SHA1 because faster than SHA256
   * and does not need to be secure.
   */
  private filename(key: string): string {
    const filename = crypto.createHash('sha1').update(key).digest('hex')
    return path.join(this.dir, filename)
  }

  /**
   * Set a value to be cached.
   */
  public set(key: string, value: string): void {
    fs.writeFileSync(this.filename(key), value, 'utf8')
  }

  /**
   * Get a value from the cache.
   */
  public get(key: string): string | undefined {
    try {
      return fs.readFileSync(this.filename(key), 'utf8')
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
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

const cache = new Cache()
export default cache
