import { XmdCodec } from './'
import notebook from '../../__fixtures__/article/r-notebook-simple'
import { snapshot, fixtureToJson, nodeToString } from '../../__tests__/helpers'

const { decode, encode } = new XmdCodec()

describe('decode', () => {
  const toJson = fixtureToJson(decode)

  test('basic.Rmd', async () => {
    expect(await toJson('basic.Rmd')).toMatchFile(snapshot('basic.json'))
  })

  test('kitchensink.Rmd', async () => {
    expect(await toJson('kitchensink.Rmd')).toMatchFile(
      snapshot('kitchensink.json')
    )
  })
})

describe('encode', () => {
  const toXmd = nodeToString(encode)

  test('r-notebook-simple', async () => {
    expect(await toXmd(notebook)).toMatchFile(snapshot('r-notebook-simple.Rmd'))
  })
})
