import * as stencila from '@stencila/schema'
import fs from 'fs-extra'
import globby from 'globby'
import path from 'path'
import { DirCodec } from '.'
import * as vfile from '../../util/vfile'
import { defaultEncodeOptions, GlobalEncodeOptions } from '../types'

const { decode, encode, sniff } = new DirCodec()

test('sniff', async () => {
  expect(await sniff(__dirname)).toBe(true)
  expect(await sniff(__filename)).toBe(false)
  expect(await sniff('foo bar')).toBe(false)
})

describe('decode', () => {
  it('creates a flat collection from a flat dir', async () => {
    const collection = await decode(flat)
    expect(collection).toMatchObject(flatNode)
  })

  it('creates a nested collection from a shallow dir', async () => {
    const collection = await decode(shallow)
    expect(collection).toMatchObject(shallowNode)
  })

  it('has a patterns option', async () => {
    expect(
      nodes(
        await decode(shallow, {
          patterns: ['**/README.*']
        })
      ).sort()
    ).toMatchObject([
      'shallow/a/README',
      'shallow/b/README',
      'shallow/c/README'
    ])

    expect(
      nodes(
        await decode(shallow, {
          patterns: ['**/a/*']
        })
      ).sort()
    ).toMatchObject(['shallow/a/README', 'shallow/a/index', 'shallow/a/main'])
  })

  it('has a mainNames option', async () => {
    expect(
      mains(
        await decode(shallow, {
          mainNames: []
        })
      )
    ).toMatchObject([])

    expect(
      mains(
        await decode(shallow, {
          mainNames: ['index']
        })
      )
    ).toMatchObject(['shallow/a/index', 'shallow/b/index'])

    expect(
      mains(
        await decode(shallow, {
          mainNames: ['README', 'index']
        })
      )
    ).toMatchObject([
      'shallow/a/README',
      'shallow/b/README',
      'shallow/c/README'
    ])
  })

  it('creates a nested collection from a deep dir', async () => {
    const collection = await decode(deep)
    expect(tree(collection)).toEqual(deepTree)
  })
})

describe('encode', () => {
  const e = (n: stencila.Node, options: Omit<GlobalEncodeOptions, 'theme'>) =>
    encode(n, { ...defaultEncodeOptions, ...options })

  it('creates a directory', async () => {
    const dir = path.join(__dirname, '__outputs__', 'flat')
    await fs.remove(dir)
    await e(flatNode, { filePath: dir })
    const files = await globby('**/*', { cwd: dir })
    expect(files.sort()).toEqual(['1.html', '2.html', '3.html', 'root.json'])
  })

  it('uses index.html for main files', async () => {
    const dir = path.join(__dirname, '__outputs__', 'shallow')
    await fs.remove(dir)
    await e(shallowNode, { filePath: dir })
    const files = await globby('**/*', { cwd: dir })
    expect(files.sort()).toEqual([
      'a/README.html',
      'a/index.html',
      'b/README.html',
      'b/index.html',
      'c/index.html',
      'root.json'
    ])
  })
})

const flat = vfile.create(path.join(__dirname, '__fixtures__', 'flat'))
const flatNode: stencila.Collection = {
  type: 'Collection',
  name: 'flat',
  parts: [
    {
      type: 'Article',
      name: '1',
      meta: { depth: 0 },
      title: 'Untitled',
      authors: [],
      content: [{ type: 'Heading', depth: 1, content: ['One'] }]
    },
    {
      type: 'Article',
      name: '2',
      meta: { depth: 0 },
      title: 'Untitled',
      authors: [],
      content: [{ type: 'Heading', depth: 1, content: ['Two'] }]
    },
    {
      type: 'Article',
      name: '3',
      meta: { depth: 0 },
      title: 'Untitled',
      authors: [],
      content: [{ type: 'Heading', depth: 1, content: ['Three'] }]
    }
  ]
}

const shallow = vfile.create(path.join(__dirname, '__fixtures__', 'shallow'))
const shallowNode: stencila.Collection = {
  type: 'Collection',
  name: 'shallow',
  parts: [
    {
      type: 'Collection',
      name: 'a',
      parts: [
        {
          type: 'Article',
          name: 'index',
          meta: { depth: 1 },
          title: 'Untitled',
          authors: [],
          content: [{ type: 'Paragraph', content: ['Index'] }]
        },
        {
          type: 'Article',
          name: 'main',
          meta: {
            main: true,
            depth: 1
          },
          title: 'Untitled',
          authors: [],
          content: [{ type: 'Paragraph', content: ['Main'] }]
        },
        {
          type: 'Article',
          name: 'README',
          meta: { depth: 1 },
          title: 'Untitled',
          authors: [],
          content: [{ type: 'Paragraph', content: ['README'] }]
        }
      ]
    },
    {
      type: 'Collection',
      name: 'b',
      parts: [
        {
          type: 'Article',
          name: 'index',
          meta: {
            main: true,
            depth: 1
          },
          title: 'Untitled',
          authors: [],
          content: [{ type: 'Paragraph', content: ['Index'] }]
        },
        {
          type: 'Article',
          name: 'README',
          meta: { depth: 1 },
          title: 'Untitled',
          authors: [],
          content: [{ type: 'Paragraph', content: ['README'] }]
        }
      ]
    },
    {
      type: 'Collection',
      name: 'c',
      parts: [
        {
          type: 'Article',
          name: 'README',
          meta: {
            main: true,
            depth: 1
          },
          title: 'Untitled',
          authors: [],
          content: [{ type: 'Paragraph', content: ['README'] }]
        }
      ]
    }
  ]
}

const deep = vfile.create(path.join(__dirname, '__fixtures__', 'deep'))
const deepTree = {
  name: 'deep',
  parts: [
    '1',
    '2',
    {
      name: 'a',
      parts: [
        '1',
        '2',
        {
          name: 'a',
          parts: [
            '1',
            '2',
            {
              name: 'a',
              parts: ['1', '2']
            }
          ]
        },
        {
          name: 'b',
          parts: ['1', '2']
        }
      ]
    },
    {
      name: 'b',
      parts: ['1', '2']
    }
  ]
}

/**
 * Get the paths of the files from the tree
 */
function nodes(
  work: stencila.CreativeWork,
  path: string = '',
  collect: string[] = []
): any {
  if (work.type === 'Collection') {
    const collection = work as stencila.Collection
    for (const part of collection.parts)
      nodes(part, path + work.name + '/', collect)
  } else {
    collect.push(path + work.name)
  }
  return collect
}

/**
 * Get the paths of the "main" files from the tree
 */
function mains(
  work: stencila.CreativeWork,
  path: string = '',
  collect: string[] = []
): any {
  if (work.type === 'Collection') {
    const collection = work as stencila.Collection
    for (const part of collection.parts)
      mains(part, path + work.name + '/', collect)
  } else {
    if (work.meta && work.meta.main) collect.push(path + work.name)
  }
  return collect
}

/**
 * Generate a more dense tree with just names on leaf nodes
 * for comparing actual vs expected decoded trees.
 */
function tree(work: stencila.CreativeWork): any {
  if (work.type === 'Collection') {
    const coll = work as stencila.Collection
    return {
      name: coll.name,
      parts: coll.parts.map(tree)
    }
  } else {
    return work.name
  }
}
