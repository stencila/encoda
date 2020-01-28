import * as vfile from '../../util/vfile'
import unlink from '../../util/unlink'
import { fixture, snapshot } from '../../__tests__/helpers'
import { decodeMultilineString, encodeMultilineString, IpynbCodec } from './'
import { JsonCodec } from '../json'
import jupyterNotebookSimple from '../../__fixtures__/article/jupyter-notebook-simple'

const ipynb = new IpynbCodec()
const json = new JsonCodec()

const ipynb2json = async (name: string) => {
  const node = await ipynb.decode(await vfile.read(fixture(name)))
  // Unlink to remove references to temporary files which will change
  // between test runs
  const unlinked = unlink(node)
  return vfile.dump(await json.encode(unlinked))
}

describe('decode', () => {
  test('metadata-v4', async () => {
    expect(await ipynb2json('metadata-v4.ipynb')).toMatchFile(
      snapshot('metadata-v4.json')
    )
  })

  test('running-code', async () => {
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
  expect(await ipynb.dump(jupyterNotebookSimple)).toMatchFile(
    snapshot('jupyter-notebook-simple.ipynb')
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
