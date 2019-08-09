import articleSimple from '../../__fixtures__/article-simple'
import { JatsPandoc } from './'

test('invertible', async () => {
  await expect(new JatsPandoc()).toInvert(articleSimple)
})
