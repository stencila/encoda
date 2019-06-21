import * as docx from '../src/codecs/docx'
import articleSimple from './fixtures/article-simple'

test('invertible', async () => {
  await expect(docx).toInvert(articleSimple)
})
