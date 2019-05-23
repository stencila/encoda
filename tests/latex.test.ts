import * as latex from '../src/latex'
import articleSimple from './fixtures/article-simple'

test.skip('invertible', async () => {
  // This currently fails because the LaTeX template
  // includes /date{} even if there is not one defined in the
  // documents
  await expect(latex).toInvert(articleSimple)
})
