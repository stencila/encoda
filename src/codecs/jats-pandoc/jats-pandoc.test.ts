import articleSimple from '../../__fixtures__/article-simple'
import { JatsPandocCodec } from './'

test('invertible', async () => {
  await expect(new JatsPandocCodec()).toInvert(articleSimple)
})
