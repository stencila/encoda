import * as json5 from '../src/codecs/json5'
import articleSimple from './fixtures/article-simple'

test('invertible', async () => {
  await expect(json5).toInvert(articleSimple)
})
