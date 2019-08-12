import articleSimple from '../../__fixtures__/article-simple'
import { DocxCodec } from './'

test('invertible', async () => {
  await expect(new DocxCodec()).toInvert(articleSimple)
})
