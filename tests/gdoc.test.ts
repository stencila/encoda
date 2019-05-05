import { parse, unparse } from '../src/gdoc'
import { dump, load } from '../src/vfile'

test('parse', async () => {
  const p = async (gdoc: any) => await parse(load(JSON.stringify(gdoc)))
  expect(await p(kitchenSink.gdoc)).toEqual(kitchenSink.node)
})

test('unparse', async () => {
  const u = async (node: any) => JSON.parse(dump(await unparse(node)))
  expect(await u(kitchenSink.node)).toEqual(kitchenSink.gdoc)
})

// An example intended for testing progressively added parser/unparser pairs
const kitchenSink = {
  gdoc: {
    title: 'Title',
    body: {
      content: [
        // Heading 1
        {
          paragraph: {
            elements: [{ textRun: { content: 'Heading one' } }],
            paragraphStyle: { namedStyleType: 'HEADING_1' }
          }
        },
        // Heading 2
        {
          paragraph: {
            elements: [{ textRun: { content: 'Heading two' } }],
            paragraphStyle: { namedStyleType: 'HEADING_2' }
          }
        },
        // Styled paragraph
        {
          paragraph: {
            elements: [
              { textRun: { content: 'A paragraph with ' } },
              {
                textRun: {
                  content: 'emphasis',
                  textStyle: { italic: true }
                }
              },
              { textRun: { content: ' and ' } },
              {
                textRun: {
                  content: 'strong',
                  textStyle: { bold: true }
                }
              },
              { textRun: { content: '.' } }
            ]
          }
        },
        // Unordered list
        {
          paragraph: {
            elements: [{ textRun: { content: 'One' } }],
            bullet: { listId: 'kix.0' }
          }
        },
        {
          paragraph: {
            elements: [{ textRun: { content: 'Two' } }],
            bullet: { listId: 'kix.0' }
          }
        },
        {
          paragraph: {
            elements: [{ textRun: { content: 'Three' } }],
            bullet: { listId: 'kix.0' }
          }
        },
        // Ordered list
        {
          paragraph: {
            elements: [{ textRun: { content: 'First' } }],
            bullet: { listId: 'kix.1' }
          }
        },
        {
          paragraph: {
            elements: [{ textRun: { content: 'Second' } }],
            bullet: { listId: 'kix.1' }
          }
        },
        {
          paragraph: {
            elements: [{ textRun: { content: 'Third' } }],
            bullet: { listId: 'kix.1' }
          }
        }
      ]
    },
    lists: {
      'kix.0': {
        listProperties: {
          nestingLevels: [
            {
              // Unordered lists do not have a `glyphType`
            }
            // More nesting levels here ...
          ]
        }
      },
      'kix.1': {
        listProperties: {
          nestingLevels: [{ glyphType: '%0' }]
        }
      }
    }
  },

  node: {
    type: 'Article',
    title: 'Title',
    authors: [],
    content: [
      {
        type: 'Heading',
        depth: 1,
        content: ['Heading one']
      },
      {
        type: 'Heading',
        depth: 2,
        content: ['Heading two']
      },
      {
        type: 'Paragraph',
        content: [
          'A paragraph with ',
          {
            type: 'Emphasis',
            content: ['emphasis']
          },
          ' and ',
          {
            type: 'Strong',
            content: ['strong']
          },
          '.'
        ]
      },
      {
        type: 'List',
        order: 'unordered',
        items: [
          {
            content: ['One'],
            type: 'Paragraph'
          },
          {
            content: ['Two'],
            type: 'Paragraph'
          },
          {
            content: ['Three'],
            type: 'Paragraph'
          }
        ]
      },
      {
        type: 'List',
        order: 'ascending',
        items: [
          {
            content: ['First'],
            type: 'Paragraph'
          },
          {
            content: ['Second'],
            type: 'Paragraph'
          },
          {
            content: ['Third'],
            type: 'Paragraph'
          }
        ]
      }
    ]
  }
}
