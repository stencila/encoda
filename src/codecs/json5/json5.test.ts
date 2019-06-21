import articleSimple from '../../__fixtures__/article-simple'
import * as json5 from './'

test('invertible', async () => {
  await expect(json5).toInvert(articleSimple)
})
