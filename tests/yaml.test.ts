import * as yaml from '../src/yaml'
import articleSimple from './fixtures/article-simple'

test('invertible', async () => {
  await expect(yaml).toInvert(articleSimple)
})
