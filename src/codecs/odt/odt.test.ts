import articleSimple from '../../__fixtures__/article/simple'
import { ODTCodec } from './'

const odt = new ODTCodec()

test('invertible', async () => {
  await expect(odt).toInvert(articleSimple)
})
