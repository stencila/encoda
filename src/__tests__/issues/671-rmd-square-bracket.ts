import schema from '@stencila/schema'
import { XmdCodec } from '../../codecs/xmd'

/**
 * See https://github.com/stencila/encoda/issues/671
 */
test('issue 671: escape right square brackets in R Markdown', async () => {
  const doc = schema.article({
    content: [
      schema.paragraph({
        content: [
          'A ',
          schema.link({ content: ['link'], target: 'https://example.org' }),
          ' and a range 0.8 [0.7-1.2].',
        ],
      }),
    ],
  })
  expect(await new XmdCodec().dump(doc)).toMatch(
    'A [link](https://example.org) and a range 0.8 \\[0.7-1.2\\].'
  )
})
