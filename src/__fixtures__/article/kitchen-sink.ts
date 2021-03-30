import {
  article,
  person,
  date,
  cite,
  citeGroup,
  paragraph,
} from '@stencila/schema'
import { tinyImageUrl } from '../image/tiny'

/**
 * An `Article` containing examples of many node types.
 */
export default article({
  title: 'Article title',
  authors: [
    person({
      givenNames: ['Jim', 'J'],
      familyNames: ['Jones'],
    }),
  ],
  datePublished: date({ value: '2020-03-13' }),
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
      type: 'Heading',
      depth: 3,
      content: ['Heading three'],
    },
    {
      type: 'Paragraph',
      content: [
        'A paragraph with ',
        {
          type: 'Emphasis',
          content: ['emphasis'],
        },
        ', ',
        {
          type: 'Strong',
          content: ['strong'],
        },
        ', ',
        {
          type: 'Delete',
          content: ['delete'],
        },
        '.',
      ],
    },
    {
      type: 'Paragraph',
      content: [
        'A paragraph with ',
        {
          type: 'Link',
          target: 'https://example.org',
          meta: {
            attr: 'foo',
          },
          content: [
            'a ',
            {
              type: 'Emphasis',
              content: ['rich'],
            },
            ' link',
          ],
        },
        '.',
      ],
    },
    {
      type: 'Paragraph',
      content: [
        'A paragraph with ',
        {
          type: 'Quote',
          cite: 'https://example.org',
          content: ['quote'],
        },
        '.',
      ],
    },
    paragraph({
      content: [
        'A paragraph with in-text citations with different citation modes. ',
        'Parenthetical: ',
        cite({ target: 'ref1' }),
        '. ',
        'Narrative: ',
        cite({ citationMode: 'Narrative', target: 'ref1' }),
        '. ',
        'Narrative author only: ',
        cite({ citationMode: 'NarrativeAuthor', target: 'ref1' }),
        '. ',
        'Narrative year only: ',
        cite({ citationMode: 'NarrativeYear', target: 'ref1' }),
        '. ',
        'Citation group with prefix and suffix text ',
        citeGroup({
          items: [
            cite({ target: 'ref1', citationPrefix: 'e.g. ' }),
            cite({ target: 'ref2', citationSuffix: ' and others' }),
          ],
        }),
        '.',
      ],
    }),
    {
      type: 'Paragraph',
      content: [
        'A paragraph with ',
        {
          type: 'CodeFragment',
          programmingLanguage: 'python',
          text: '# code',
        },
        '.',
      ],
    },
    {
      type: 'Paragraph',
      content: [
        'A paragraph with an image ',
        {
          type: 'ImageObject',
          contentUrl: tinyImageUrl,
          title: 'title',
          text: 'alt text',
        },
        '.',
      ],
    },
    {
      type: 'Paragraph',
      content: ['Paragraph with a ', true, ' and a ', false, '.'],
    },
    {
      type: 'Paragraph',
      content: [
        'A paragraph with other data: a ',
        null,
        ', a ',
        3.14,
        ', and a ',
        [1, 2],
        '.',
      ],
    },
    {
      type: 'QuoteBlock',
      cite: 'https://example.org',
      content: ['A blockquote'],
    },
    {
      type: 'CodeBlock',
      programmingLanguage: 'r',
      text: '# Some R code\nx <- c(1,2)',
    },
    {
      type: 'CodeBlock',
      programmingLanguage: 'js',
      text: '// Some Javascript code\nconst inc = (n) => n + 1',
    },
    {
      type: 'List',
      order: 'unordered',
      items: [
        { type: 'ListItem', content: ['One'] },
        { type: 'ListItem', content: ['Two'] },
        { type: 'ListItem', content: ['Three'] },
      ],
    },
    {
      type: 'List',
      order: 'ascending',
      items: [
        { type: 'ListItem', content: ['First'] },
        { type: 'ListItem', content: ['Second'] },
        { type: 'ListItem', content: ['Third'] },
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
  references: [
    article({
      id: 'ref1',
      authors: [person({ familyNames: ['Adams'], givenNames: ['B'] })],
      datePublished: '1990',
    }),
    article({
      id: 'ref2',
      authors: [person({ familyNames: ['Smith'], givenNames: ['T'] })],
      datePublished: '1991',
    }),
  ],
})
