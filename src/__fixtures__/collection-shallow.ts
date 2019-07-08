import stencila from '@stencila/schema'

const collection: stencila.Collection = {
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

export default collection
