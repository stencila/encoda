import { XmdCodec } from './'
import { simple } from './__fixtures__/simple'
import { snapshot, fixtureToJson } from '../../__tests__/helpers'

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
  test('simple.ts', async () => {
    expect(await encode(simple)).toMatchFile(snapshot('simple.Rmd'))
  })
})
