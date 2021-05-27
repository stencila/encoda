export const gdoc = {
  body: {
    content: [
      {
        paragraph: {
          elements: [{ textRun: { content: 'Parent' } }],
          bullet: { listId: 'kix.list0' },
        },
      },
      {
        paragraph: {
          elements: [{ textRun: { content: 'Child A' } }],
          bullet: { listId: 'kix.list0', nestingLevel: 1 },
        },
      },
      {
        paragraph: {
          elements: [{ textRun: { content: 'Grandchild 1' } }],
          bullet: { listId: 'kix.list0', nestingLevel: 2 },
        },
      },
      {
        paragraph: {
          elements: [{ textRun: { content: 'Child B' } }],
          bullet: { listId: 'kix.list0', nestingLevel: 1 },
        },
      },
      {
        paragraph: {
          elements: [{ textRun: { content: 'Grandchild 2' } }],
          bullet: { listId: 'kix.list0', nestingLevel: 2 },
        },
      },
    ],
  },
  lists: {
    'kix.list0': {
      listProperties: {
        nestingLevels: [{}, { glyphType: '%0' }, {}],
      },
    },
  },
}

export const node = {
  type: 'Article',
  content: [
    {
      type: 'List',
      order: 'Unordered',
      items: [
        {
          type: 'ListItem',
          content: [
            {
              type: 'Paragraph',
              content: ['Parent'],
            },
            {
              type: 'List',
              order: 'Ascending',
              items: [
                {
                  type: 'ListItem',
                  content: [
                    {
                      type: 'Paragraph',
                      content: ['Child A'],
                    },
                    {
                      type: 'List',
                      order: 'Unordered',
                      items: [
                        {
                          type: 'ListItem',
                          content: [
                            {
                              type: 'Paragraph',
                              content: ['Grandchild 1'],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
                {
                  type: 'ListItem',
                  content: [
                    {
                      type: 'Paragraph',
                      content: ['Child B'],
                    },
                    {
                      type: 'List',
                      order: 'Unordered',
                      items: [
                        {
                          type: 'ListItem',
                          content: [
                            {
                              type: 'Paragraph',
                              content: ['Grandchild 2'],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
