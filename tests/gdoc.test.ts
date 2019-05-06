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
  // Note that this object is missing many styling related properties that
  // are normally in a GDoc. To keep it a managable size, throughout the
  // object tree, we've only included the properties that the compiler uses.
  // A good way to generate content nodes is to author in GDocs and then
  // fetch using the `gapis.js` script (see there for more details).
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
        // Paragraph
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
              { textRun: { content: ' and ' } },
              {
                textRun: {
                  content: 'a link',
                  textStyle: { link: { url: 'http://example.com' } }
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
        },
        // Table
        {
          table: {
            tableRows: [
              {
                tableCells: [
                  {
                    content: [
                      {
                        paragraph: {
                          elements: [{ textRun: { content: 'A' } }]
                        }
                      }
                    ]
                  },
                  {
                    content: [
                      {
                        paragraph: {
                          elements: [{ textRun: { content: 'B' } }]
                        }
                      }
                    ]
                  },
                  {
                    content: [
                      {
                        paragraph: {
                          elements: [{ textRun: { content: 'C' } }]
                        }
                      }
                    ]
                  }
                ]
              },
              {
                tableCells: [
                  {
                    content: [
                      {
                        paragraph: {
                          elements: [{ textRun: { content: '1' } }]
                        }
                      }
                    ]
                  },
                  {
                    content: [
                      {
                        paragraph: {
                          elements: [{ textRun: { content: '2' } }]
                        }
                      }
                    ]
                  },
                  {
                    content: [
                      {
                        paragraph: {
                          elements: [{ textRun: { content: '3' } }]
                        }
                      }
                    ]
                  }
                ]
              },
              {
                tableCells: [
                  {
                    content: [
                      {
                        paragraph: {
                          elements: [{ textRun: { content: '4' } }]
                        }
                      }
                    ]
                  },
                  {
                    content: [
                      {
                        paragraph: {
                          elements: [{ textRun: { content: '5' } }]
                        }
                      }
                    ]
                  },
                  {
                    content: [
                      {
                        paragraph: {
                          elements: [{ textRun: { content: '6' } }]
                        }
                      }
                    ]
                  }
                ]
              }
            ]
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
          ' and ',
          {
            type: 'Link',
            content: ['a link'],
            target: 'http://example.com'
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
      },
      {
        type: 'Table',
        rows: [
          {
            type: 'TableRow',
            cells: [
              {
                content: ['A'],
                type: 'TableCell'
              },
              {
                content: ['B'],
                type: 'TableCell'
              },
              {
                content: ['C'],
                type: 'TableCell'
              }
            ]
          },
          {
            type: 'TableRow',
            cells: [
              {
                content: ['1'],
                type: 'TableCell'
              },
              {
                content: ['2'],
                type: 'TableCell'
              },
              {
                content: ['3'],
                type: 'TableCell'
              }
            ]
          },
          {
            type: 'TableRow',
            cells: [
              {
                content: ['4'],
                type: 'TableCell'
              },
              {
                content: ['5'],
                type: 'TableCell'
              },
              {
                content: ['6'],
                type: 'TableCell'
              }
            ]
          }
        ]
      }
    ]
  }
}
