import articleSimple from '../../__fixtures__/article/simple'
import { LatexCodec } from './'

const latex = new LatexCodec()

test('invertible', async () => {
  await expect(latex).toInvert(articleSimple)
})
