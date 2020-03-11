import { XmlCodec } from '.'
import { fixture, snapshot } from '../../__tests__/helpers'
import { Json5Codec } from '../json5'

const xmlCodec = new XmlCodec()
const json5Codec = new Json5Codec()

describe('decode', () => {
  it('returns null if malformed XML', async () => {
    expect(await xmlCodec.load('<not-xml $3%*#("')).toBe(null)
  })
  it('returns null if no <stencila> element', async () => {
    expect(await xmlCodec.load('<not-stencila></not-stencila>')).toBe(null)
  })
})

describe('round-trip', () => {
  test('kitchen-sink', async () => {
    const expected = await json5Codec.read(fixture('kitchen-sink.json5'))
    expect(await xmlCodec.dump(expected)).toMatchFile(
      snapshot('kitchen-sink.xml')
    )
    const actual = await xmlCodec.read(snapshot('kitchen-sink.xml'))
    expect(actual).toEqual(expected)
  })
})
