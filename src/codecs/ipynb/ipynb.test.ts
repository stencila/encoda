import { unlinkFiles } from '../../util/media/unlinkFiles'
import jupyterNotebookSimple from '../../__fixtures__/article/jupyter-notebook-simple'
import { fixture, snapshot } from '../../__tests__/helpers'
import { JsonCodec } from '../json'
import { decodeMultilineString, encodeMultilineString, IpynbCodec } from './'

const ipynbCodec = new IpynbCodec()
const jsonCodec = new JsonCodec()

describe('decode', () => {
  test('MultilineString', () => {
    const mls1 = ['Line1\n', 'Line2']
    const mls2 = 'Line1\nLine2'
    const str1 = 'Line1\nLine2'

    expect(decodeMultilineString(mls1)).toEqual(str1)
    expect(decodeMultilineString(mls2)).toEqual(str1)
    expect(encodeMultilineString(str1)).toEqual(mls1)
  })

  test.each(['metadata-v4', 'running-code', 'sunspots', 'well-switching'])(
    '%s',
    async (name) => {
      expect(
        await jsonCodec.dump(
          // Unlink files to remove references to temporary files (which
          // will change between test runs)
          unlinkFiles(await ipynbCodec.read(fixture(name + '.ipynb')))
        )
      ).toMatchFile(snapshot(name + '.json'))
    }
  )
})

describe('encode', () => {
  test.each([
    ['jupyter-notebook-simple', jupyterNotebookSimple],
    ['elife-50356', 'article/journal/elife/50356.json'],
    ['plosone-0229075', 'article/journal/plosone/0229075.json'],
  ])('%s', async (name, nodeOrPath) => {
    const node =
      typeof nodeOrPath === 'string'
        ? await jsonCodec.read(fixture(nodeOrPath))
        : nodeOrPath
    expect(await ipynbCodec.dump(node)).toMatchFile(snapshot(name + '.ipynb'))
  })
})

describe('encode+decode', () => {
  test.each([['jupyter-notebook-simple', jupyterNotebookSimple]])(
    '%s',
    async (name, encoded) => {
      const ipynb = await ipynbCodec.dump(encoded)
      const decoded = await ipynbCodec.load(ipynb)
      expect(decoded).toEqual(encoded)
    }
  )
})
