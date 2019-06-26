import articleSimple from '../../__fixtures__/article-simple'
import * as yaml from './'

test('invertible', async () => {
  await expect(yaml).toInvert(articleSimple)
})
