import { collection, article, paragraph } from '@stencila/schema'

/**
 * A nested `Collection` (i.e. containing other collections)
 */
export default collection({
  name: 'shallow',
  parts: [
    collection({
      name: 'a',
      parts: [
        article({
          name: 'index',
          content: [paragraph({ content: ['Index'] })]
        }),
        article({
          name: 'main',
          meta: {
            main: true
          },
          content: [paragraph({ content: ['Main'] })]
        }),
        article({
          name: 'README',
          content: [paragraph({ content: ['README'] })]
        })
      ]
    }),
    collection({
      name: 'b',
      parts: [
        article({
          name: 'index',
          meta: {
            main: true
          },
          content: [paragraph({ content: ['Index'] })]
        }),
        article({
          name: 'README',
          content: [paragraph({ content: ['README'] })]
        })
      ]
    }),
    collection({
      name: 'c',
      parts: [
        article({
          name: 'README',
          meta: {
            main: true
          },
          content: [paragraph({ content: ['README'] })]
        })
      ]
    })
  ]
})
