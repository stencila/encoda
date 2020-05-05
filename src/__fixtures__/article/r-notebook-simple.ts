import {
  article,
  codeChunk,
  heading,
  paragraph,
  person,
} from '@stencila/schema'

/**
 * An `Article` representing a simple R notebook: has
 * some `CodeChunk` and `CodeExpression` nodes along with
 * other content.
 */
export default article({
  title: 'The article title',
  authors: [
    person({
      givenNames: ['Jane'],
      familyNames: ['Jones'],
    }),
  ],
  datePublished: '2020-04-01',
  content: [
    codeChunk({
      text: 'x <- 3.14',
      programmingLanguage: 'r',
    }),
    heading({
      depth: 1,
      content: ['A heading'],
    }),
    paragraph({
      content: [
        'An inline code chunk ',
        {
          text: 'x * 2.2',
          type: 'CodeExpression',
          programmingLanguage: 'r',
        },
        '.',
      ],
    }),
    paragraph({
      content: [
        'Plain inline code ',
        {
          text: 'x * 6',
          type: 'CodeFragment',
        },
        '.',
      ],
    }),
    heading({
      depth: 2,
      content: ['Another heading'],
    }),
    paragraph({
      content: ['A block code chunk'],
    }),
    codeChunk({
      text: '# A comment\nsum(1:10)',
      programmingLanguage: 'r',
    }),
    paragraph({
      content: ['A block code chunk with name and options'],
    }),
    codeChunk({
      text: 'plot(1:10)',
      programmingLanguage: 'r',
      meta: {
        label: 'my_plot',
        'fig.height': '7',
        'fig.width': '8',
      },
    }),
  ],
})
