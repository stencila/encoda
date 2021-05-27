import stencila from '@stencila/schema'
import path from 'path'
import { read, write } from '../..'

test('issue 95: extra bullet in blockquote', async () => {
  const md = path.join(__dirname, '95-extra-bullet.md')
  const docx = path.join(__dirname, '95-extra-bullet.out.docx')

  const expectedFromMd: stencila.Article = {
    type: 'Article',
    content: [
      {
        type: 'Heading',
        depth: 2,
        content: ['Prerequisites'],
      },
      {
        type: 'QuoteBlock',
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
                    content: [
                      'Having R and RStudio installed (though see the first lesson, ',
                      {
                        type: 'Link',
                        content: ['Before we start'],
                        target:
                          'http://datacarpentry.org/R-ecology-lesson/00-before-we-start.html',
                      },
                      ' for installation instructions)',
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

  const expectedFromDocx: stencila.Article = {
    type: 'Article',
    content: [
      {
        type: 'Heading',
        depth: 2,
        content: ['Prerequisites'],
      },
      {
        // The child-parent relationship between QuoteBlock and List is inverted.
        // This seems to be because Pandoc classifies a paragraph as a `BlockQuote`
        // based on it's paragraph style "Block Text". This would be difficult to fix.
        type: 'List',
        order: 'Unordered',
        items: [
          {
            type: 'ListItem',
            content: [
              {
                type: 'QuoteBlock',
                content: [
                  {
                    type: 'Paragraph',
                    content: [
                      'Having R and RStudio installed (though see the first lesson, ',
                      {
                        type: 'Link',
                        content: ['Before we start'],
                        target:
                          'http://datacarpentry.org/R-ecology-lesson/00-before-we-start.html',
                      },
                      ' for installation instructions)',
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

  // Check that the loaded Markdown doesn't have an extra bullet
  const article = await read(md)
  expect(article).toEqual(expectedFromMd)

  // Write the article to DOCX
  await write(article, docx)

  // Read it back from DOCX
  const articleFromDocx = await read(docx)
  expect(articleFromDocx).toEqual(expectedFromDocx)
})
