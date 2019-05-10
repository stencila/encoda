import * as docx from '../src/docx'
import articleSimple from './fixtures/article-simple'

test('invertible', async () => {
  await expect(docx).toInvert(articleSimple)
})
