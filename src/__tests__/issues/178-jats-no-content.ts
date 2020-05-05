import * as schema from '@stencila/schema'
import { JatsCodec } from '../../codecs/jats'
import { snapshot } from '../helpers'

const jats = new JatsCodec()

test('issue 178: encoding should not fail if no article content', async () => {
  expect(
    await jats.dump(
      schema.article({
        title: 'Recherches sur les substances radioactives',
        authors: [
          {
            type: 'Person',
            honorificPrefix: 'Dr',
            givenNames: ['Marie', 'Skłodowska'],
            familyNames: ['Curie'],
            honorificSuffix: 'PhD',
          },
        ],
      })
    )
  ).toMatchFile(snapshot('178-jats-no-content.jats.xml'))
})
