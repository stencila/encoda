import * as stencila from '@stencila/schema'
import { fixture, snapshot } from '../../__tests__/helpers'
import { read, dump } from '../..'
import { GDocCodec } from '.'

const gdocCodec = new GDocCodec()

const gdoc2node = async (gdoc: any) =>
  await gdocCodec.load(JSON.stringify(gdoc), { fetch: false })

const gdocFixtureTo = async (gdoc: string, format: string) =>
  await dump(await read(fixture('test-fixture-1.gdoc')), 'md')

const node2gdoc = async (node: any) => JSON.parse(await gdocCodec.dump(node))

test('decode:kitchensink', async () => {
  expect(await gdoc2node(kitchenSink.gdoc)).toEqual(kitchenSink.node)
})

test('encode:kitchensink', async () => {
  expect(await node2gdoc(kitchenSink.node)).toEqual(kitchenSink.gdoc)
})

describe('decode:fixtures', () => {
  test('test-fixture-1.gdoc', async () =>
    expect(await gdocFixtureTo('test-fixture-1.gdoc', 'md')).toMatchFile(
      snapshot('test-fixture-1.md')
    ))
})

describe('decode:title', () => {
  test('use the title string property', async () => {
    expect(
      await gdoc2node({
        title: 'Title'
      })
    ).toEqual(stencila.article([], 'Title'))
  })

  test('override with Title styled paragraph', async () => {
    expect(
      await gdoc2node({
        title: 'Title',
        body: {
          content: [
            {
              paragraph: {
                elements: [{ textRun: { content: 'The actual title!' } }],
                paragraphStyle: { namedStyleType: 'TITLE' }
              }
            }
          ]
        }
      })
    ).toEqual(stencila.article([], [stencila.paragraph(['The actual title!'])]))
  })

  test('set as empty string if neither present', async () => {
    expect(await gdoc2node({})).toEqual(stencila.article([], ''))
  })
})

test('decode:nested-list', async () => {
  expect(await gdoc2node(nestedList.gdoc)).toEqual(nestedList.node)
})

// Note that the following fixtrures are missing many styling related properties that
// are normally in a GDoc. To keep a manageable size, throughout the
// tree, we've only included the properties that the codec uses.
// A good way to generate content nodes is to author in GDocs and then
// fetch using the `gapis.js` script (see there for more details).

// An example intended for testing progressively added decoder/encoder pairs
const kitchenSink = {
  gdoc: {
    title: 'Title',
    body: {
      content: [
        // The first element is always a section break
        {
          sectionBreak: {}
        },
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
                  content: 'delete',
                  textStyle: { strikethrough: true }
                }
              },
              { textRun: { content: ' and ' } },
              {
                textRun: {
                  content: 'superscript',
                  textStyle: { baselineOffset: 'SUPERSCRIPT' }
                }
              },
              { textRun: { content: ' and ' } },
              {
                textRun: {
                  content: 'subscript',
                  textStyle: { baselineOffset: 'SUBSCRIPT' }
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
        // Image
        {
          paragraph: {
            elements: [
              {
                inlineObjectElement: {
                  inlineObjectId: 'kix.inlineobj0'
                }
              }
            ]
          }
        },
        // Unordered list
        {
          paragraph: {
            elements: [{ textRun: { content: 'One' } }],
            bullet: { listId: 'kix.list0' }
          }
        },
        {
          paragraph: {
            elements: [{ textRun: { content: 'Two' } }],
            bullet: { listId: 'kix.list0' }
          }
        },
        {
          paragraph: {
            elements: [{ textRun: { content: 'Three' } }],
            bullet: { listId: 'kix.list0' }
          }
        },
        // Ordered list
        {
          paragraph: {
            elements: [{ textRun: { content: 'First' } }],
            bullet: { listId: 'kix.list1' }
          }
        },
        {
          paragraph: {
            elements: [{ textRun: { content: 'Second' } }],
            bullet: { listId: 'kix.list1' }
          }
        },
        {
          paragraph: {
            elements: [{ textRun: { content: 'Third' } }],
            bullet: { listId: 'kix.list1' }
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
        },
        // ThematicBreak
        {
          sectionBreak: {}
        }
      ]
    },
    lists: {
      'kix.list0': {
        listProperties: {
          nestingLevels: [
            {
              // Unordered lists do not have a `glyphType`
            }
          ]
        }
      },
      'kix.list1': {
        listProperties: {
          nestingLevels: [{ glyphType: '%0' }]
        }
      }
    },
    inlineObjects: {
      'kix.inlineobj0': {
        inlineObjectProperties: {
          embeddedObject: {
            title: 'The title',
            description: 'The description',
            imageProperties: {
              contentUri: 'https://lh3.googleusercontent.com/just-an-example'
            }
          }
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
            type: 'Delete',
            content: ['delete']
          },
          ' and ',
          {
            type: 'Superscript',
            content: ['superscript']
          },
          ' and ',
          {
            type: 'Subscript',
            content: ['subscript']
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
        type: 'Paragraph',
        content: [
          {
            type: 'ImageObject',
            contentUrl: 'https://lh3.googleusercontent.com/just-an-example',
            title: 'The title',
            text: 'The description'
          }
        ]
      },
      {
        type: 'List',
        order: 'unordered',
        items: [
          {
            type: 'ListItem',
            content: [
              {
                content: ['One'],
                type: 'Paragraph'
              }
            ]
          },
          {
            type: 'ListItem',
            content: [
              {
                content: ['Two'],
                type: 'Paragraph'
              }
            ]
          },
          {
            type: 'ListItem',
            content: [
              {
                content: ['Three'],
                type: 'Paragraph'
              }
            ]
          }
        ]
      },
      {
        type: 'List',
        order: 'ascending',
        items: [
          {
            type: 'ListItem',
            content: [
              {
                content: ['First'],
                type: 'Paragraph'
              }
            ]
          },
          {
            type: 'ListItem',
            content: [
              {
                content: ['Second'],
                type: 'Paragraph'
              }
            ]
          },
          {
            type: 'ListItem',
            content: [
              {
                content: ['Third'],
                type: 'Paragraph'
              }
            ]
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
      },
      {
        type: 'ThematicBreak'
      }
    ]
  }
}

const nestedList = {
  gdoc: {
    body: {
      content: [
        {
          paragraph: {
            elements: [{ textRun: { content: 'Parent' } }],
            bullet: { listId: 'kix.list0' }
          }
        },
        {
          paragraph: {
            elements: [{ textRun: { content: 'Child A' } }],
            bullet: { listId: 'kix.list0', nestingLevel: 1 }
          }
        },
        {
          paragraph: {
            elements: [{ textRun: { content: 'Grandchild 1' } }],
            bullet: { listId: 'kix.list0', nestingLevel: 2 }
          }
        },
        {
          paragraph: {
            elements: [{ textRun: { content: 'Child B' } }],
            bullet: { listId: 'kix.list0', nestingLevel: 1 }
          }
        },
        {
          paragraph: {
            elements: [{ textRun: { content: 'Grandchild 2' } }],
            bullet: { listId: 'kix.list0', nestingLevel: 2 }
          }
        }
      ]
    },
    lists: {
      'kix.list0': {
        listProperties: {
          nestingLevels: [{}, { glyphType: '%0' }, {}]
        }
      }
    }
  },

  node: {
    type: 'Article',
    title: '',
    authors: [],
    content: [
      {
        type: 'List',
        order: 'unordered',
        items: [
          {
            type: 'ListItem',
            content: [
              {
                type: 'Paragraph',
                content: ['Parent']
              },
              {
                type: 'List',
                order: 'ascending',
                items: [
                  {
                    type: 'ListItem',
                    content: [
                      {
                        type: 'Paragraph',
                        content: ['Child A']
                      },
                      {
                        type: 'List',
                        order: 'unordered',
                        items: [
                          {
                            type: 'ListItem',
                            content: [
                              {
                                type: 'Paragraph',
                                content: ['Grandchild 1']
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  },
                  {
                    type: 'ListItem',
                    content: [
                      {
                        type: 'Paragraph',
                        content: ['Child B']
                      },
                      {
                        type: 'List',
                        order: 'unordered',
                        items: [
                          {
                            type: 'ListItem',
                            content: [
                              {
                                type: 'Paragraph',
                                content: ['Grandchild 2']
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
}
