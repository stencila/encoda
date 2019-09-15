import * as vfile from '../../util/vfile'
import unlink from '../../util/unlink'
import { fixture, snapshot } from '../../__tests__/helpers'
import { decodeMultilineString, encodeMultilineString, IpynbCodec } from './'
import { JsonCodec } from '../json'

const ipynb = new IpynbCodec()
const json = new JsonCodec()

const ipynb2json = async (name: string) => {
  const node = await ipynb.decode(await vfile.read(fixture(name)))
  // Unlink to remove references to temporary files which will change
  // between test runs
  const unlinked = await unlink(node)
  return vfile.dump(await json.encode(unlinked))
}

const json2ipynb = async (name: string) =>
  vfile.dump(
    await ipynb.encode(await json.decode(await vfile.read(fixture(name))))
  )

describe('decode', () => {
  test('metadata-v4', async () => {
    expect(await ipynb2json('metadata-v4.ipynb')).toMatchFile(
      snapshot('metadata-v4.json')
    )
  })

  test.skip('running-code', async () => {
    // TODO: This test is currently failing, seemingly due to a bug
    // in `md.stringifyHTML` which deals with HTML in HTML. Reinstate
    // this when that is fixed.
    expect(await ipynb2json('running-code.ipynb')).toMatchFile(
      snapshot('running-code.json')
    )
  })

  test('sunspots', async () => {
    expect(await ipynb2json('sunspots.ipynb')).toMatchFile(
      snapshot('sunspots.json')
    )
  })

  test('well switching', async () => {
    expect(await ipynb2json('well-switching.ipynb')).toMatchFile(
      snapshot('well-switching.json')
    )
  })
})

test('encode', async () => {
  expect(await json2ipynb('kitchen-sink.json')).toMatchFile(
    snapshot('kitchen-sink.ipynb')
  )
})

test('encode+decode MultilineString', () => {
  const mls1 = ['Line1\n', 'Line2']
  const mls2 = 'Line1\nLine2'
  const str1 = 'Line1\nLine2'

  expect(decodeMultilineString(mls1)).toEqual(str1)
  expect(decodeMultilineString(mls2)).toEqual(str1)
  expect(encodeMultilineString(str1)).toEqual(mls1)
})
