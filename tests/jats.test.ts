import * as jats from '../src/jats'
import articleSimple from './fixtures/article-simple'

test('invertible', async () => {
  await expect(jats).toInvert(articleSimple)
})
