import * as json5 from '../src/json5'
import articleSimple from './fixtures/article-simple'

test('invertible', async () => {
  await expect(json5).toInvert(articleSimple)
})
