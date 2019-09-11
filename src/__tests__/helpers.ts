import callsites from 'callsites'
import fs from 'fs-extra'
import * as nock from 'nock'
import path from 'path'
import * as vfile from '../util/vfile'

/**
 * Get the full path to a file in the closest `__fixtures__` directory
 */
export const fixture = (filename: string, caller: number = 2): string => {
  let dir = callDir(caller)
  let fixtures = ''
  let attempts = 0
  do {
    fixtures = path.join(dir, '__fixtures__')
    if (fs.pathExistsSync(fixtures)) break
    dir = path.dirname(dir)
    attempts += 1
  } while (dir !== '/' && attempts < 5)
  return path.join(fixtures, filename)
}

/**
 * Read a fixture into a `VFile`
 */
export const readFixture = async (filename: string): Promise<vfile.VFile> =>
  vfile.read(fixture(filename, 3))

/**
 * Get the full path to a file in the `__file_snapshots__` sibling directory
 */
export const snapshot = (filename: string): string =>
  path.join(callDir(), '__file_snapshots__', filename)

/**
 * Record a nock request / response as a file fixture
 *
 * Attempt to use other solutions for this e.g. `nock-record`
 * and `jest-nock-back` failed because they interfered
 * with other tests.
 *
 * @param filename The filename of the records HTTP request / response
 */
export const nockRecord = async (filename: string) => {
  const mode = (process.env.NOCK_MODE || 'record') as nock.BackMode
  nock.back.setMode(mode)
  nock.back.fixtures = path.join(callDir(), '__fixtures__')
  const result = await nock.back(filename)
  return result.nockDone
}

/**
 * The directory of the the calling test file
 */
const callDir = (caller: number = 2) => path.dirname(callsites()[caller].getFileName() || '')
