import articleSimple from '../../__fixtures__/article/simple'
import { Json5Codec } from './'

test('invertible', async () => {
  await expect(new Json5Codec()).toInvert(articleSimple)
})
