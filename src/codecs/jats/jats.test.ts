import articleSimple from '../../__fixtures__/article-simple'
import * as jats from './'

test('invertible', async () => {
  await expect(jats).toInvert(articleSimple)
})
