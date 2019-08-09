import articleSimple from '../../__fixtures__/article-simple'
import { Yaml } from './'

test('invertible', async () => {
  await expect(new Yaml()).toInvert(articleSimple)
})
