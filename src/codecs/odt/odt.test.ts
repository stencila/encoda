import articleSimple from '../../__fixtures__/article-simple'
import { ODT } from './'

test.skip('invertible', async () => {
  // This currently fails because Pandoc does not recognise the
  // `odt` Title paragraph style.
  await expect(new ODT()).toInvert(articleSimple)
})
