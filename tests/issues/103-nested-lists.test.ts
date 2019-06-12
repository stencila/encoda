import stencila from '@stencila/schema'
import path from 'path'
import { read } from '../../src'

test('issue 103: loss of nested lists', async () => {
  const article = [
    {
      type: 'List',
      order: 'ascending',
      items: [
        {
          type: 'ListItem',
          content: [
            { type: 'Paragraph', content: ['Fruit'] },
            {
              type: 'List',
              order: 'ascending',
              items: [
                {
                  type: 'ListItem',
                  content: [
                    { type: 'Paragraph', content: ['Apple'] },
                    { type: 'Paragraph', content: ['Orange'] },
                    { type: 'Paragraph', content: ['Banana'] }
                  ]
                }
              ]
            }
          ]
        },
        {
          type: 'ListItem',
          content: [
            { type: 'Paragraph', content: ['Dairy'] },
            {
              type: 'List',
              order: 'ascending',
              items: [
                {
                  type: 'ListItem',
                  content: [
                    { type: 'Paragraph', content: ['Milk'] },
                    { type: 'Paragraph', content: ['Cheese'] }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]

  const md = (await read(
    path.join(__dirname, '103-nested-lists.md')
  )) as stencila.Article
  expect(md.content).toEqual(article)
  expect(md).toInvert(article)

  const docx = (await read(
    path.join(__dirname, '103-nested-lists.docx')
  )) as stencila.Article
  expect(docx.content).toEqual(article)
  expect(docx).toInvert(article)

  // GDoc publically shared at:
  //   https://docs.google.com/document/d/1SzJJ1SXHH5g1zjv8IUc3r67vUl8pFSvuU1fAAl3DyZo/edit?usp=sharing
  // and fetch locally
  const gdoc = (await read(
    path.join(__dirname, '103-nested-lists.gdoc')
  )) as stencila.Article
  expect(gdoc.content).toEqual(article)
  expect(gdoc).toInvert(article)
})
