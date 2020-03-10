import { XmlCodec } from '.'
import { fixture, snapshot } from '../../__tests__/helpers'
import { Json5Codec } from '../json5'

const xmlCodec = new XmlCodec()
const json5Codec = new Json5Codec()

// Skip on Windows CI due to these errors:
// https://dev.azure.com/stencila/stencila/_build/results?buildId=719&view=logs&j=b17395f6-68a3-5682-0476-d3f6f1043109&t=0d6dcb53-0957-53aa-c18a-237166af945a&l=443
if (!(process.env.CI && process.platform === 'win32'))
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
