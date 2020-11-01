import schema from '@stencila/schema'
import path from 'path'
import { JSDOM } from 'jsdom'
import fs from 'fs'

import { JatsCodec } from '../../codecs/jats'
import { BibCodec } from '../../codecs/bib'
import { HTMLCodec } from '../../codecs/html'

/**
 * See https://github.com/stencila/encoda/issues/737
 */
test('issue 737: references with an organisational author', async () => {
  const article = (await new JatsCodec().read(
    path.join(__dirname, '737-elife-43154.xml')
  )) as schema.Article

  const org = schema.organization({
    name: 'Malaria Genomic Epidemiology Network',
  })

  // The first author of `bib7` should be an `Organization` node
  const ref = article.references?.[6] as schema.CreativeWork
  expect(ref.id).toBe('bib7')
  expect(ref.authors?.[0]).toEqual(org)

  // When encoded to BibTeX, the first author should be represented
  // as an literal name (inside curly braces)
  const bib = await new BibCodec().dump(ref)
  expect(bib).toBe(
    `@article{bib7,
\tjournal = {Nature Genetics},
\ttitle = {Reappraisal of known malaria resistance loci in a large multicenter study},
\tvolume = {46},
\tauthor = {{Malaria Genomic Epidemiology Network} and Rockett, KA and Clarke, GM and Fitzpatrick, K and Hubbart, C and Jeffreys, AE and Rowlands, K and Craik, R and Jallow, M and Conway, DJ},
\tpages = {1197--1204},
\tdate = {2014},
\tyear = {2014},
}

`
  )

  // When decoded from BibTeX, the first author should be an `Organization` node
  const node = ((await new BibCodec().load(bib)) as schema.CreativeWork[])[0]
  expect(node.id).toBe('bib7')
  expect(node.authors?.[0]).toEqual(org)

  // When encoded to HTML, the first author should have organization Microdata
  // and citations should use the full name.
  const html = await new HTMLCodec().dump(article)
  const dom = new JSDOM(html).window.document.documentElement
  const refElem = dom.querySelector('#bib7 [itemprop=author]:first-of-type')
  expect(refElem).toHaveAttribute('itemtype', 'http://schema.org/Organization')
  expect(refElem).toHaveTextContent('Malaria Genomic Epidemiology Network')
  const citeElem = dom.querySelector('a[href="#bib7"]')
  expect(citeElem).toHaveTextContent(
    'Malaria Genomic Epidemiology Network et al., 2014'
  )
})
