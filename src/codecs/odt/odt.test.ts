import articleSimple from '../../__fixtures__/article-simple'
import * as odt from './'

test.skip('invertible', async () => {
  await expect(odt).toInvert(articleSimple)
})
