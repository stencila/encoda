/**
 * @module dir
 */

import stencila from '@stencila/schema'
import { getLogger } from '@stencila/logga'
import path from 'path'
import fs from 'fs-extra'
import { Encode, EncodeOptions, read } from '../..'
import * as vfile from '../../util/vfile'
import globby from 'globby'
import { isCreativeWork } from '../../util'
import { range } from 'fp-ts/lib/Array'
import { array, option, ord } from 'fp-ts'
import { pipe } from 'fp-ts/lib/pipeable'

const log = getLogger('encoda:dir')

export const mediaTypes = []

export const extNames = ['dir']

interface DirDecodeOptions {
  /**
   * Minimatch patterns to use to select only some of the included
   * files. Defaults to `['**/ /*']` (i.e. everything, including in
   * nested directories)
   */
  patterns?: string[]
}

/**
 * Decode a directory into a Stencila `Collection`, that may include
 * other `CreativeWork`s, such as `Article`s or other `Collection`s.
 */
export async function decode(
  file: vfile.VFile,
  options: DirDecodeOptions = {}
): Promise<stencila.Collection> {
  const patterns = options.patterns || ['**/*']

  const root: stencila.Collection = {
    type: 'Collection',
    parts: []
  }

  const dirPath = file.path
  if (!dirPath) {
    log.error('Path to a directory is required')
    return root
  }

  const stat = await fs.stat(dirPath)
  if (!stat.isDirectory()) {
    log.error('Path is not a directory')
    return root
  }

  const { name } = path.parse(dirPath)
  root.name = name

  // Get a list of matching files
  const filePaths = await globby(patterns, {
    cwd: dirPath
  })

  // Decompose file paths into parts so that they
  // can be sorted by depth AND name
  const routes = filePaths
    .map(filePath => filePath.split(path.sep))
    .sort((a, b) => {
      return (
        a.length - b.length || a[a.length - 1].localeCompare(b[b.length - 1])
      )
    })

  // Read files in parallel
  const nodes = (await Promise.all(
    routes.map(async route => {
      const node = await read(path.join(dirPath, ...route))
      if (isCreativeWork(node)) {
        const { name } = path.parse(route[route.length - 1])
        return {
          route,
          node: { name, ...node }
        }
      }
    })
  ))
    // Remove files that were not decoded as creative works
    // (using reduce instead of filter to keep Typescript happy)
    .reduce(
      (prev: { route: string[]; node: stencila.CreativeWork }[], curr) =>
        curr ? [...prev, curr] : prev,
      []
    )

  // Organize files into nested collections of CreativeWorks
  const collections = new Map<string, stencila.Collection>()
  collections.set('', root)
  for (const { route, node } of nodes) {
    let parent = root
    for (const depth of range(0, route.length - 2)) {
      const level = route.slice(0, depth + 1).join('/')
      let collection = collections.get(level)
      if (!collection) {
        collection = {
          type: 'Collection',
          name: route[depth],
          parts: []
        }
        collections.set(level, collection)
        parent.parts.push(collection)
      }
      parent = collection
    }
    parent.parts.push(node)
  }

  return root
}

interface DirEncodeOptions {
  // TODO:
}

export const encode: Encode<DirEncodeOptions> = async (
  node: stencila.Node,
  options: EncodeOptions<DirEncodeOptions> = {}
): Promise<vfile.VFile> => {
  throw new Error('TODO: Not implemented')
}
