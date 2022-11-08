/**
 * [[include:src/codecs/dir/README.md]]
 *
 * @module codecs/dir
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

import { getLogger } from '@stencila/logga'
import schema from '@stencila/schema'
import fs from 'fs-extra'
import globby from 'globby'
import path from 'path'
import tempy from 'tempy'
import trash from 'trash'
import { read, write } from '../..'
import * as vfile from '../../util/vfile'
import { Codec, CommonEncodeOptions, CommonDecodeOptions } from '../types'

const log = getLogger('encoda:dir')

export interface EncodeOptions extends CommonEncodeOptions {
  /**
   * The format to decode parts of the `Collection` as.
   * Defaults to `html`. Different from the common option
   * `format`, which in this case is `dir`.
   */
  fileFormat?: string
}

export interface DecodeOptions extends CommonDecodeOptions {
  /**
   * Minimatch patterns to use to select only some of the included
   * files. Defaults to '**\/\*' (i.e. everything, including in
   * nested directories)
   */
  patterns?: string | string[]

  /**
   * The file base names (i.e. without extension) that should
   * be considered to be the "main" file in a directory.
   * Defaults to `['main', 'index', 'README']`
   */
  mainNames?: string | string[]
}

export class DirCodec
  extends Codec<EncodeOptions, DecodeOptions>
  implements Codec<EncodeOptions, DecodeOptions>
{
  public readonly extNames = ['dir']

  /**
   * Sniff the path to see if it is a directory
   */
  public readonly sniff = async (content: string): Promise<boolean> => {
    const dirPath = content
    if (await fs.pathExists(dirPath)) {
      const stats = await fs.stat(dirPath)
      if (stats.isDirectory()) return true
    }
    return false
  }

  /**
   * Decode a directory into a Stencila `Collection`, that may include
   * other `CreativeWork`s, such as `Article`s or other `Collection`s.
   */
  public readonly decode = async (
    file: vfile.VFile,
    options: DecodeOptions = {}
  ): Promise<schema.Collection> => {
    let { patterns = ['**/*'], mainNames = ['main', 'index', 'README'] } =
      options
    if (typeof patterns === 'string') patterns = patterns.split(/\s+/)
    if (typeof mainNames === 'string') mainNames = mainNames.split(/\s+/)

    const root: schema.Collection = {
      type: 'Collection',
      parts: [],
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
      cwd: dirPath,
    })

    // Decompose file paths into parts so that they
    // can be sorted by depth AND name
    const routes = filePaths
      .map((filePath) => filePath.split(path.sep))
      .sort((a, b) => {
        return (
          a.length - b.length || a[a.length - 1].localeCompare(b[b.length - 1])
        )
      })

    // Read files into nodes in parallel
    const nodes = (
      await Promise.all(
        routes.map(async (route) => {
          const node = await read(path.join(dirPath, ...route))
          if (schema.isIn('CreativeWorkTypes', node)) {
            const { name } = path.parse(route[route.length - 1])
            const depth = route.length - 1
            return {
              route,
              node: {
                name,
                ...node,
                meta: { ...node.meta, depth },
              },
            }
          }
        })
      )
    )
      // Remove files that were not decoded as creative works
      // (using reduce instead of filter to keep Typescript happy)
      .reduce(
        (prev: { route: string[]; node: schema.CreativeWork }[], curr) =>
          curr ? [...prev, curr] : prev,
        []
      )

    // Sort lexically for deterministic results
    const sorted = nodes.sort((a, b) => (a.route < b.route ? -1 : 1))

    // Organize nodes into nested collections of CreativeWorks
    const collections = new Map<string, schema.Collection>()
    collections.set('', root)
    for (const { route, node } of sorted) {
      let parent = root
      let depth = 0
      while (depth < route.length - 1) {
        const level = route.slice(0, depth + 1).join('/')
        let collection = collections.get(level)
        if (!collection) {
          collection = {
            type: 'Collection',
            name: route[depth],
            parts: [],
          }
          collections.set(level, collection)
          parent.parts.push(collection)
        }
        parent = collection
        depth += 1
      }
      parent.parts.push(node)
    }

    // For each collection determine the main node, if any
    mainNames.reverse()
    for (const collection of collections.values()) {
      const rankings = collection.parts
        .map((node, index) => ({
          which: index,
          rank: mainNames.indexOf(node.name ?? ''),
        }))
        .filter((item) => item.rank > -1)
        .sort((a, b) => b.rank - a.rank)
      const first = rankings[0]
      if (first) {
        const node = collection.parts[first.which]
        node.meta = {
          ...node.meta,
          main: true,
        }
      }
    }

    return root
  }

  public readonly encode = async (
    node: schema.Node,
    options: EncodeOptions = this.commonEncodeDefaults
  ): Promise<vfile.VFile> => {
    const dirPath = options.filePath ?? tempy.directory()
    const format = options.fileFormat ?? 'html'

    // Wrap to a collection as necessary
    const cw = schema.isIn('CreativeWorkTypes', node)
      ? node
      : schema.creativeWork({ content: [node] })
    const root = schema.isA('Collection', cw)
      ? (node as schema.Collection)
      : schema.collection({ parts: [cw] })

    // Create a flattened list of nodes and their routes and
    // add `meta.root` to point to the root collection
    const parts = walk(root)
    function walk(
      node: schema.CreativeWork,
      route: string[] = []
    ): {
      route: string[]
      node: schema.CreativeWork
    }[] {
      if (schema.isA('Collection', node)) {
        return node.parts
          .map((child) => walk(child, [...route, node.name ?? '']))
          .reduce((prev, curr) => [...prev, ...curr], [])
      } else {
        return [
          {
            route: [...route, node.name ?? 'unnamed'],
            node,
          },
        ]
      }
    }

    // Trash destination directory if it already exists
    if (await fs.pathExists(dirPath)) {
      await trash(dirPath)
      log.info(`Existing directory "${dirPath}" sent to trash`)
    }

    // Ensure all the necessary directories are made
    // TODO: this could be optimized to avoid lots of ensureDir calls
    for (const { route } of parts) {
      const partPath = path.join(dirPath, ...route.slice(1, -1))
      await fs.ensureDir(partPath)
    }

    // Output the root `Collection` as JSON so that is can be used as
    // a 'sitemap' for the directory. But to minimize size remove
    // any `content`.
    function strip(node: schema.CreativeWork): schema.CreativeWork {
      if (schema.isA('Collection', node)) {
        return {
          ...node,
          parts: node.parts.map((child) => strip(child)),
        }
      } else {
        const { content, ...rest } = node
        return rest
      }
    }
    await write(strip(root), path.join(dirPath, 'root.json'))

    // Generate the output files, in desired format, in 'parallel'
    await Promise.all(
      parts.map(async ({ route, node }) => {
        const fileName =
          (node.meta?.main ? 'index' : route[route.length - 1]) + '.' + format
        const filePath = path.join(dirPath, ...route.slice(1, -1), fileName)
        return write(node, filePath, { ...options, format })
      })
    )

    return vfile.create(dirPath)
  }

  /**
   * @override Override of {@link Codec.read} to "read" from a
   * directory and return a `Collection`.
   */
  public async read(
    source: string,
    options?: DecodeOptions
  ): Promise<schema.Collection> {
    return this.decode(vfile.create(source), options)
  }
}
