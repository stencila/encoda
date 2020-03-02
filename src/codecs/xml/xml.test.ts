import { read } from '../..'
import { fixture, snapshot } from '../../__tests__/helpers'
import { XmlCodec } from '.'

const xml = new XmlCodec()

describe('decode', () => {
  it('returns null if malformed XML', async () => {
    expect(await xml.load('<not-xml $3%*#("')).toBe(null)
  })
  it('returns null if no <stencila> element', async () => {
    expect(await xml.load('<not-stencila></not-stencila>')).toBe(null)
  })
})

describe('round-trip', () => {
  test('kitchen-sink', async () => {
    const expected = await read(fixture('kitchen-sink.json5'))
    expect(await xml.dump(expected)).toMatchFile(snapshot('kitchen-sink.xml'))
    const actual = await xml.read(snapshot('kitchen-sink.xml'))
    expect(actual).toEqual(expected)
  })
})
