import articleSimple from '../../__fixtures__/article-simple'
import { Docx } from './'

test('invertible', async () => {
  await expect(new Docx()).toInvert(articleSimple)
})
