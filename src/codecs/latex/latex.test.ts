import articleSimple from '../../__fixtures__/article/simple'
import { fixture, snapshot } from '../../__tests__/helpers'
import { JsonCodec } from '../json'
import { LatexCodec } from './'

const jsonCodec = new JsonCodec()
const latexCodec = new LatexCodec()

test('invertible', async () => {
  await expect(latexCodec).toInvert(articleSimple)
})

describe('fixtures', () => {
  test('test1.tex', async () => {
    const test1 = await latexCodec.read(fixture('test1.tex'), {
      shouldCoerce: false,
      shouldReshape: false,
    })
    expect(await jsonCodec.dump(test1)).toMatchFile(snapshot('test1.json'))
  })
})
