import articleSimple from '../../__fixtures__/article-simple'
import { YamlCodec } from './'

const yamlCodec = new YamlCodec()

describe('encode', () => {
  test('property ordering', async () =>
    expect(
      await yamlCodec.dump({
        depth: 1,
        content: ['Heading number one'],
        type: 'Heading',
        id: 'heading-1'
      })
    ).toEqual(
      `type: Heading
id: heading-1
depth: 1
content:
  - Heading number one
`
    ))
})

test('invertible', async () => {
  await expect(yamlCodec).toInvert(articleSimple)
})
