import articleSimple from '../../__fixtures__/article-simple'
import * as odt from './'

test.skip('invertible', async () => {
  // This currently fails because Pandoc does not recognise the
  // `odt` Title paragraph style.
  await expect(odt).toInvert(articleSimple)
})
