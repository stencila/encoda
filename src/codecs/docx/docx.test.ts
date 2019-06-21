import articleSimple from '../../__fixtures__/article-simple'
import * as docx from './'

test('invertible', async () => {
  await expect(docx).toInvert(articleSimple)
})
