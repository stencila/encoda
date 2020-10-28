import { Article } from '@stencila/schema'
import { unlinkFiles } from '../../util/media/unlinkFiles'
import jupyterNotebookSimple from '../../__fixtures__/article/jupyter-notebook-simple'
import { fixture, snapshot } from '../../__tests__/helpers'
import { JsonCodec } from '../json'
import { decodeMultilineString, encodeMultilineString, IpynbCodec } from './'

const ipynbCodec = new IpynbCodec()
const jsonCodec = new JsonCodec()

const eLifeArticle = 'article/journal/elife/50356.json'
const plosArticle = 'article/journal/plosone/0229075.json'

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
    ['elife-50356', eLifeArticle],
    ['plosone-0229075', plosArticle],
  ])('%s', async (name, nodeOrPath) => {
    const node =
      typeof nodeOrPath === 'string'
        ? await jsonCodec.read(fixture(nodeOrPath))
        : nodeOrPath
    expect(await ipynbCodec.dump(node)).toMatchFile(snapshot(name + '.ipynb'))
  })
})

describe('encode+decode', () => {
  // Test that metadata is encoded and then decoded
  // correctly in roundtrip. Does not compare content
  // because of loss of some structure when encoding
  // to IPYNB e.g. figure collections
  test.each([
    ['jupyter-notebook-simple', jupyterNotebookSimple, 'all'],
    ['elife-50356', eLifeArticle, 'meta'],
    ['plosone-0229075', plosArticle, 'meta'],
  ])('%s', async (name, nodeOrPath, compare) => {
    const node =
      typeof nodeOrPath === 'string'
        ? await jsonCodec.read(fixture(nodeOrPath))
        : nodeOrPath
    const ipynb = await ipynbCodec.dump(node)
    const decoded = await ipynbCodec.load(ipynb)
    if (compare === 'meta') {
      const { content: decodedContent, ...decodededRest } = decoded as Article
      const { content: expectedContent, ...expectedRest } = node as Article
      expect(decodededRest).toEqual(expectedRest)
    } else expect(decoded).toEqual(node)
  })
})
