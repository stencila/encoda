import articleSimple from '../../__fixtures__/article-simple'
import { LatexCodec } from './'

test.skip('invertible', async () => {
  // This currently fails because the LaTeX template
  // includes /date{} even if there is not one defined in the
  // documents
  await expect(new LatexCodec()).toInvert(articleSimple)
})
