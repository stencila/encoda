import articleSimple from '../../__fixtures__/article-simple'
import { YamlCodec } from './'

test('invertible', async () => {
  await expect(new YamlCodec()).toInvert(articleSimple)
})
