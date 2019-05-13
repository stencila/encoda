import * as latex from '../src/latex'
import articleSimple from './fixtures/article-simple'

test('invertible', async () => {
  await expect(latex).toInvert(articleSimple)
})
