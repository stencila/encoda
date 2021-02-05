import schema from '@stencila/schema'
import { JSDOM } from 'jsdom'
import { HTMLCodec } from '../../codecs/html'
import { IpynbCodec } from '../../codecs/ipynb'
import { XmdCodec } from '../../codecs/xmd'

/**
 * See https://github.com/stencila/encoda/issues/673
 *
 * Tests that `content` for `Cite` nodes in `.rmd` and `.ipynb` files
 * is populated when converted to `.html`.
 */
test('issue 673: resolve citations in R Markdown and Jupyter Notebooks', async () => {
  const xmdCodec = new XmdCodec()
  const ipynbCodec = new IpynbCodec()
  const htmlCodec = new HTMLCodec()

  let dom
  async function toDom(node: schema.Node) {
    return new JSDOM(await htmlCodec.dump(node)).window.document.documentElement
  }

  dom = await toDom(
    await xmdCodec.load(`---
references:
  - type: Article
    id: bib1
    title: An article
    authors:
      - Smith
      - Jones
    datePublished: 1990
---

In a para @bib1.

figure:
:::
In a figure caption @bib1.
:::

A citation that aint @bib42 in references.
`)
  )
  expect(dom).toHaveTextContent('In a para 1Smith and Jones, 1990.')
  expect(dom).toHaveTextContent('In a figure caption 1Smith and Jones, 1990.')
  expect(dom).toHaveTextContent('A citation that aint bib42 in references.')

  dom = await toDom(
    await ipynbCodec.load(
      JSON.stringify({
        metadata: {
          references: [
            {
              type: 'Article',
              id: 'bib1',
              title: 'An article',
              authors: ['Singh', 'Stevens', 'Sontag'],
              datePublished: '2022-10-31',
            },
          ],
        },
        cells: [
          {
            cell_type: 'markdown',
            metadata: {},
            source: ['In a para @bib1 and one that aint @foo.'],
          },
        ],
      })
    )
  )
  expect(dom).toHaveTextContent(
    'In a para 1Singh et al., 2022 and one that aint foo.'
  )
})
