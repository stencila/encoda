import { decode, encode } from '.'
import path from 'path'
import * as vfile from '../../util/vfile'
import * as stencila from '@stencila/schema'

describe('decode', () => {
  it('creates a flat collection from a flat dir', async () => {
    const collection = await decode(flat)
    expect(collection).toEqual(flatNode)
  })

  it('creates a nested collection from a shallow dir', async () => {
    const collection = await decode(shallow)
    expect(collection).toEqual(shallowNode)
  })

  it('creates a nested collection from a deep dir', async () => {
    const collection = await decode(deep)
    expect(tree(collection)).toEqual(deepTree)
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
      title: 'Untitled',
      authors: [],
      content: [{ type: 'Heading', depth: 1, content: ['One'] }]
    },
    {
      type: 'Article',
      name: '2',
      title: 'Untitled',
      authors: [],
      content: [{ type: 'Heading', depth: 1, content: ['Two'] }]
    },
    {
      type: 'Article',
      name: '3',
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
          title: 'Untitled',
          authors: [],
          content: [{ type: 'Paragraph', content: ['Index'] }]
        },
        {
          type: 'Article',
          name: 'main',
          meta: {
            main: true
          },
          title: 'Untitled',
          authors: [],
          content: [{ type: 'Paragraph', content: ['Main'] }]
        },
        {
          type: 'Article',
          name: 'README',
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
            main: true
          },
          title: 'Untitled',
          authors: [],
          content: [{ type: 'Paragraph', content: ['Index'] }]
        },
        {
          type: 'Article',
          name: 'README',
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
            main: true
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
 * Generate a more dense tree just names on leaf nodes
 * for comparing, actual with expected.
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
