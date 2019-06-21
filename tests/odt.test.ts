import * as odt from '../src/codecs/odt'
import articleSimple from './fixtures/article-simple'

test.skip('invertible', async () => {
  await expect(odt).toInvert(articleSimple)
})
