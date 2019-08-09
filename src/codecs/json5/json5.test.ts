import articleSimple from '../../__fixtures__/article-simple'
import { Json5 } from './'

test('invertible', async () => {
  await expect(new Json5()).toInvert(articleSimple)
})
