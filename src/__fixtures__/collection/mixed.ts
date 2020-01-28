import { collection } from '@stencila/schema'

/**
 * A heterogenous, single level collection made up of
 * `Article`, `Datatable` and other node types.
 */
export default collection({
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
      type: 'Datatable',
      name: 'two',
      columns: [
        {
          type: 'DatatableColumn',
          name: 'A',
          values: [1, 2, 3]
        },
        {
          type: 'DatatableColumn',
          name: 'B',
          values: [4, 5, 6]
        }
      ]
    },
    {
      type: 'Article',
      name: 'three',
      title: 'Article three',
      authors: [],
      content: [{ type: 'Heading', depth: 1, content: ['Three'] }]
    }
  ]
})
