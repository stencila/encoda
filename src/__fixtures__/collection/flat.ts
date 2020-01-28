import { collection, article, heading } from '@stencila/schema'

/**
 * A homogenous, single level collection made up of
 * `Article` nodes only.
 */
export default collection({
  name: 'flat',
  parts: [
    article({
      name: 'one',
      title: 'Article one',
      content: [heading({ depth: 1, content: ['One'] })]
    }),
    article({
      name: 'two',
      title: 'Article two',
      content: [heading({ depth: 1, content: ['Two'] })]
    }),
    article({
      name: 'three',
      title: 'Article three',
      content: [heading({ depth: 1, content: ['Three'] })]
    })
  ]
})
