import { read, dump } from '../..'
import { fixture, snapshot } from '../../__tests__/helpers'
import { XmlCodec } from '.'

const xmlCodec = new XmlCodec()

describe('round-trip', () => {
  test('kitchen-sink', async () => {
    const expected = await read(fixture('kitchen-sink.json5'))
    expect(await dump(expected, 'xml')).toMatchFile(snapshot('kitchen-sink.xml'))
    const actual = await read(snapshot('kitchen-sink.xml'))
    expect(actual).toEqual(expected)
  })
})

