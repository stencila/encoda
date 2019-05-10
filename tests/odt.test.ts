import * as odt from '../src/odt'
import articleSimple from './fixtures/article-simple'

test('invertible', async () => {
  await expect(odt).toInvert(articleSimple)
})
