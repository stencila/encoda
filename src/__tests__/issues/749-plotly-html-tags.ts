import schema from '@stencila/schema'
import { JSDOM } from 'jsdom'

import { HTMLCodec } from '../../codecs/html'
import { plotlyMediaType } from '../../codecs/plotly'

/**
 * See https://github.com/stencila/encoda/issues/749
 */
test('issue 749: encoding of JSON data', async () => {
  const html = await new HTMLCodec().dump(
    schema.imageObject({
      contentUrl: '',
      content: [
        {
          mediaType: plotlyMediaType,
          data: [
            {
              x: [1, 2, 3],
              y: [0, 1, 0],
              labels: {
                x: 'R <sup>2</sup>',
              },
              title:
                'Figure 3: R <sup>2</sup> between MRI and histology across measures',
            },
          ],
        },
      ],
    })
  )
  const dom = new JSDOM(html).window.document.documentElement
  const script = dom.querySelector(`script[type="${plotlyMediaType}"`)
  expect(script).toHaveTextContent(
    '[{"x":[1,2,3],"y":[0,1,0],"labels":{"x":"R <sup>2</sup>"},"title":"Figure 3: R <sup>2</sup> between MRI and histology across measures"}]'
  )
})
