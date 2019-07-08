/**
 * A homogenous, single level collection made up of
 * `Article` nodes only.
 */

import stencila from '@stencila/schema'

const collection: stencila.Collection = {
  type: 'Collection',
  name: 'flat',
  parts: [
    {
      type: 'Article',
      name: 'one',
      title: 'Article one',
      authors: [],
      content: [{ type: 'Heading', depth: 1, content: ['One'] }]
    },
    {
      type: 'Article',
      name: 'two',
      title: 'Article two',
      authors: [],
      content: [{ type: 'Heading', depth: 1, content: ['Two'] }]
    },
    {
      type: 'Article',
      name: 'three',
      title: 'Article three',
      authors: [],
      content: [{ type: 'Heading', depth: 1, content: ['Three'] }]
    }
  ]
}

export default collection
