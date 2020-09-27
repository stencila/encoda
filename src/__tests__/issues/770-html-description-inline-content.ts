import schema from '@stencila/schema'
import { JSDOM } from 'jsdom'
import { HTMLCodec } from '../../codecs/html'

/**
 * See https://github.com/stencila/encoda/issues/770
 */
describe('issue 770: Handle inline elements in Article description', async () => {
  const doc = async (article: schema.Article) => {
    const innerHTML = await new HTMLCodec().dump(article)
    return new JSDOM(innerHTML).window.document.documentElement
  }

  it('does not nest inline elements inside extra paragraphs', async () => {
    const article = schema.article({
      description: [
        'Paragraph with ',
        schema.link({ content: ['a link'], target: 'http://stenci.la' }),
        "and let's throw in our 1",
        schema.superscript({ content: ['st'] }),
        'superscript shall we?',
      ],
    })

    const actual = (await doc(article)).querySelector(
      '[data-itemprop="description"]'
    )

    expect(actual?.querySelectorAll('p')).toHaveLength(1)
    expect(actual?.outerHTML).toMatchSnapshot()
  })

  it('does not wrap the description if it is already a paragraph', async () => {
    const article = schema.article({
      description: [
        schema.paragraph({
          content: [
            'Paragraph with ',
            schema.link({ content: ['a link'], target: 'http://stenci.la' }),
            "and let's throw in our 1",
            schema.superscript({ content: ['st'] }),
            'superscript shall we?',
          ],
        }),
      ],
    })

    const actual = (await doc(article)).querySelector(
      '[data-itemprop="description"]'
    )

    expect(actual?.querySelectorAll('p')).toHaveLength(1)
    expect(actual?.outerHTML).toMatchSnapshot()
  })
})
