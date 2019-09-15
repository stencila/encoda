import * as stencila from '@stencila/schema'

export const simple: stencila.Article = {
  type: 'Article',
  title: 'The article title',
  authors: [
    {
      type: 'Person',
      givenNames: ['Jane'],
      familyNames: ['Jones']
    }
  ],
  content: [
    {
      type: 'CodeChunk',
      text: "x <- 3.14",
      programmingLanguage: 'r'
    },
    {
      type: 'Heading',
      depth: 1,
      content: ['A heading']
    },
    {
      type: 'Paragraph',
      content: [
        'An inline code chunk ',
        {
          text: 'x * 2.2',
          type: 'CodeExpression',
          programmingLanguage: 'r'
        },
        '.'
      ]
    },
    {
      type: 'Paragraph',
      content: [
        'Plain inline code ',
        {
          text: 'x * 6',
          type: 'CodeFragment'
        },
        '.'
      ]
    },
    {
      type: 'Heading',
      depth: 2,
      content: ['Another heading']
    },
    {
      type: 'Paragraph',
      content: [
        'A block code chunk'
      ]
    },
    {
      type: 'CodeChunk',
      text: "# A comment\nsum(1:10)",
      programmingLanguage: 'r'
    },
    {
      type: 'Paragraph',
      content: [
        'A block code chunk with name and options'
      ]
    },
    {
      type: 'CodeChunk',
      text: 'plot(1:10)',
      programmingLanguage: 'r',
      meta: {
        'label': 'my_plot',
        'fig.height': '7',
        'fig.width': '8'
      }
    }
  ]
}
