import schema from '@stencila/schema'
import { JSDOM } from 'jsdom'

import { HTMLCodec } from '../../codecs/html'

/**
 * See https://github.com/stencila/encoda/issues/764
 *
 * Note the desired lack of whitespace in "FacilityGeorgiaUnited States"
 */
test('issue 764: indentation of certain HTML elements', async () => {
  const html = await new HTMLCodec().dump(
    schema.article({
      authors: [
        schema.person({
          familyNames: ['Lewis'],
          givenNames: ['L', 'Michelle'],
          affiliations: [
            schema.organization({
              name: 'University of Georgia, Bioexpression and Fermentation Facility',
              address: schema.postalAddress({
                addressLocality: 'Georgia',
                addressCountry: 'United States',
              }),
            }),
          ],
        }),
      ],
    })
  )

  const dom = new JSDOM(html).window.document.documentElement
  expect(dom.querySelector('#author-organization-1')).toHaveTextContent(
    'University of Georgia, Bioexpression and Fermentation FacilityGeorgiaUnited States'
  )
})
