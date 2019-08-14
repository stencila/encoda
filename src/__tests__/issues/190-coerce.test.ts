import { coerce } from '../../util/coerce'

/**
 * This issue was not related to `QuoteBlock` per se, but to how we
 * were using Ajv for coercion and in particular the interaction of
 * `useDefaults` and `removeAdditional` options and the `allOf` schema keyword.
 */
test('issue 190: coerce does not throw a validation error with nested content', async () => {
  const pre = {
    type: 'QuoteBlock',
    content: [
      {
        type: 'Heading',
        depth: '1',
        content: ['Heading with depth as a string instead of number.']
      },
      {
        type: 'Paragraph',
        content: 'A string which should be coerced to an array.'
      },
      {
        type: 'Paragraph',
        content: [
          'A paragraph with an Emphasis node that requires content to be coerced',
          {
            type: 'Emphasis',
            content: 'emphasised'
          }
        ]
      }
    ]
  }
  const post = {
    type: 'QuoteBlock',
    content: [
      {
        type: 'Heading',
        depth: 1, // Coerced to integer
        content: ['Heading with depth as a string instead of number.']
      },
      {
        type: 'Paragraph',
        content: ['A string which should be coerced to an array.']
      },
      {
        type: 'Paragraph',
        content: [
          'A paragraph with an Emphasis node that requires content to be coerced',
          {
            type: 'Emphasis',
            content: ['emphasised']
          }
        ]
      }
    ]
  }

  expect(await coerce(pre)).toEqual(post)
})
