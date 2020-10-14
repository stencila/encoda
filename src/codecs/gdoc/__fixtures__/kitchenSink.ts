export const gdoc = {
  title: 'Title',
  body: {
    content: [
      // The first element is always a section break
      {
        sectionBreak: {},
      },
      // Heading 1
      {
        paragraph: {
          elements: [{ textRun: { content: 'Heading one' } }],
          paragraphStyle: { namedStyleType: 'HEADING_1' },
        },
      },
      // Heading 2
      {
        paragraph: {
          elements: [{ textRun: { content: 'Heading two' } }],
          paragraphStyle: { namedStyleType: 'HEADING_2' },
        },
      },
      // Paragraph
      {
        paragraph: {
          elements: [
            { textRun: { content: 'A paragraph with ' } },
            {
              textRun: {
                content: 'emphasis',
                textStyle: { italic: true },
              },
            },
            { textRun: { content: ' and ' } },
            {
              textRun: {
                content: 'strong',
                textStyle: { bold: true },
              },
            },
            { textRun: { content: ' and ' } },
            {
              textRun: {
                content: 'delete',
                textStyle: { strikethrough: true },
              },
            },
            { textRun: { content: ' and ' } },
            {
              textRun: {
                content: 'superscript',
                textStyle: { baselineOffset: 'SUPERSCRIPT' },
              },
            },
            { textRun: { content: ' and ' } },
            {
              textRun: {
                content: 'subscript',
                textStyle: { baselineOffset: 'SUBSCRIPT' },
              },
            },
            { textRun: { content: ' and ' } },
            {
              textRun: {
                content: 'a link',
                textStyle: { link: { url: 'http://example.com' } },
              },
            },
            { textRun: { content: '.' } },
          ],
        },
      },
      // Image
      {
        paragraph: {
          elements: [
            {
              inlineObjectElement: {
                inlineObjectId: 'kix.inlineobj0',
              },
            },
          ],
        },
      },
      // Unordered list
      {
        paragraph: {
          elements: [{ textRun: { content: 'One' } }],
          bullet: { listId: 'kix.list0' },
        },
      },
      {
        paragraph: {
          elements: [{ textRun: { content: 'Two' } }],
          bullet: { listId: 'kix.list0' },
        },
      },
      {
        paragraph: {
          elements: [{ textRun: { content: 'Three' } }],
          bullet: { listId: 'kix.list0' },
        },
      },
      // Ordered list
      {
        paragraph: {
          elements: [{ textRun: { content: 'First' } }],
          bullet: { listId: 'kix.list1' },
        },
      },
      {
        paragraph: {
          elements: [{ textRun: { content: 'Second' } }],
          bullet: { listId: 'kix.list1' },
        },
      },
      {
        paragraph: {
          elements: [{ textRun: { content: 'Third' } }],
          bullet: { listId: 'kix.list1' },
        },
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
                        elements: [{ textRun: { content: 'A' } }],
                      },
                    },
                  ],
                },
                {
                  content: [
                    {
                      paragraph: {
                        elements: [{ textRun: { content: 'B' } }],
                      },
                    },
                  ],
                },
                {
                  content: [
                    {
                      paragraph: {
                        elements: [{ textRun: { content: 'C' } }],
                      },
                    },
                  ],
                },
              ],
            },
            {
              tableCells: [
                {
                  content: [
                    {
                      paragraph: {
                        elements: [{ textRun: { content: '1' } }],
                      },
                    },
                  ],
                },
                {
                  content: [
                    {
                      paragraph: {
                        elements: [{ textRun: { content: '2' } }],
                      },
                    },
                  ],
                },
                {
                  content: [
                    {
                      paragraph: {
                        elements: [{ textRun: { content: '3' } }],
                      },
                    },
                  ],
                },
              ],
            },
            {
              tableCells: [
                {
                  content: [
                    {
                      paragraph: {
                        elements: [{ textRun: { content: '4' } }],
                      },
                    },
                  ],
                },
                {
                  content: [
                    {
                      paragraph: {
                        elements: [{ textRun: { content: '5' } }],
                      },
                    },
                  ],
                },
                {
                  content: [
                    {
                      paragraph: {
                        elements: [{ textRun: { content: '6' } }],
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
      // ThematicBreak
      {
        sectionBreak: {},
      },
    ],
  },
  lists: {
    'kix.list0': {
      listProperties: {
        nestingLevels: [
          {
            // Unordered lists do not have a `glyphType`
          },
        ],
      },
    },
    'kix.list1': {
      listProperties: {
        nestingLevels: [{ glyphType: '%0' }],
      },
    },
  },
  inlineObjects: {
    'kix.inlineobj0': {
      inlineObjectProperties: {
        embeddedObject: {
          title: 'The title',
          description: 'The description',
          imageProperties: {
            contentUri: 'https://lh3.googleusercontent.com/just-an-example',
          },
        },
      },
    },
  },
}

export const node = {
  type: 'Article',
  title: 'Title',
  content: [
    {
      type: 'Heading',
      depth: 1,
      content: ['Heading one'],
    },
    {
      type: 'Heading',
      depth: 2,
      content: ['Heading two'],
    },
    {
      type: 'Paragraph',
      content: [
        'A paragraph with ',
        {
          type: 'Emphasis',
          content: ['emphasis'],
        },
        ' and ',
        {
          type: 'Strong',
          content: ['strong'],
        },
        ' and ',
        {
          type: 'Delete',
          content: ['delete'],
        },
        ' and ',
        {
          type: 'Superscript',
          content: ['superscript'],
        },
        ' and ',
        {
          type: 'Subscript',
          content: ['subscript'],
        },
        ' and ',
        {
          type: 'Link',
          content: ['a link'],
          target: 'http://example.com',
        },
        '.',
      ],
    },
    {
      type: 'Paragraph',
      content: [
        {
          type: 'ImageObject',
          contentUrl: 'https://lh3.googleusercontent.com/just-an-example',
          title: 'The title',
          text: 'The description',
        },
      ],
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
              type: 'Paragraph',
            },
          ],
        },
        {
          type: 'ListItem',
          content: [
            {
              content: ['Two'],
              type: 'Paragraph',
            },
          ],
        },
        {
          type: 'ListItem',
          content: [
            {
              content: ['Three'],
              type: 'Paragraph',
            },
          ],
        },
      ],
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
              type: 'Paragraph',
            },
          ],
        },
        {
          type: 'ListItem',
          content: [
            {
              content: ['Second'],
              type: 'Paragraph',
            },
          ],
        },
        {
          type: 'ListItem',
          content: [
            {
              content: ['Third'],
              type: 'Paragraph',
            },
          ],
        },
      ],
    },
    {
      type: 'Table',
      rows: [
        {
          type: 'TableRow',
          cells: [
            {
              content: ['A'],
              type: 'TableCell',
            },
            {
              content: ['B'],
              type: 'TableCell',
            },
            {
              content: ['C'],
              type: 'TableCell',
            },
          ],
        },
        {
          type: 'TableRow',
          cells: [
            {
              content: ['1'],
              type: 'TableCell',
            },
            {
              content: ['2'],
              type: 'TableCell',
            },
            {
              content: ['3'],
              type: 'TableCell',
            },
          ],
        },
        {
          type: 'TableRow',
          cells: [
            {
              content: ['4'],
              type: 'TableCell',
            },
            {
              content: ['5'],
              type: 'TableCell',
            },
            {
              content: ['6'],
              type: 'TableCell',
            },
          ],
        },
      ],
    },
    {
      type: 'ThematicBreak',
    },
  ],
}
