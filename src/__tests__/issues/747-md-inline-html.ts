import schema from '@stencila/schema'

import { HTMLCodec } from '../../codecs/html'
import { MdCodec } from '../../codecs/md'

/**
 * See https://github.com/stencila/encoda/issues/747
 *
 * Turns out that this was not a problem with the `html` codec but rather
 * with the `md` codec that was converting embedded inline HTML into an array of
 * nodes (which were then not getting translated to HTML properly).
 */
describe('issue 747: rendering of Superscript nodes in HTML', () => {
  const htmlCodec = new HTMLCodec()
  const mdCodec = new MdCodec()

  test('HTML codec dumps a superscript as expected', async () => {
    // The HTML codec actually works fine when dumping superscripts
    expect(
      await htmlCodec.dump(
        schema.paragraph({
          content: ['R', schema.superscript({ content: ['2'] }), '.']
        })
      )
    ).toBe(
      `<p itemscope="" itemtype="http://schema.stenci.la/Paragraph" data-itemscope="root">R<sup
    itemscope="" itemtype="http://schema.stenci.la/Superscript">2</sup>.</p>`
    )
  })

  test('Markdown codec loads a HTML superscript as expected', async () => {
    // The Markdown codec works fine when loading a simple superscript
    const article = (await mdCodec.load('R<sup>2</sup>.')) as schema.Article
    expect(article?.content?.[0] || '').toEqual(
      schema.paragraph({
        content: ['R', schema.superscript({ content: ['2'] }), '.']
      })
    )
  })

  test('Markdown codec loads two HTML superscripts in a paragraph', async () => {
    // But when there are two superscripts in an array, the second one and
    // any following content gets wrapped into an array and the following content
    // is also repeated.
    const article = (await mdCodec.load(
      `First <sup>1</sup> second <sup>2</sup> after.`
    )) as schema.Article
    expect(article.content?.[0] || '').toEqual(
      schema.paragraph({
        content: [
          'First ',
          schema.superscript({ content: ['1'] }),
          ' second ',
          schema.superscript({ content: ['2'] }),
          '.'
        ]
      })
    )
  })

  test('Markdown codec loads two HTML links in a paragraph', async () => {
    // The same happens with other tags e.g. <a>.
    const article = (await mdCodec.load(
      `First <a href="a1">1</a> second <a href="a2">2</a> after.`
    )) as schema.Article
    expect(article.content?.[0] || '').toEqual(
      schema.paragraph({
        content: [
          'First ',
          schema.link({ content: ['1'], target: 'a1' }),
          ' second ',
          schema.link({ content: ['2'], target: 'a2' }),
          '.'
        ]
      })
    )
  })
})
