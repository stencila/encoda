import schema from '@stencila/schema'
import { removeDataUris } from '../../util/media/removeDataUris'
import { unlinkFiles } from '../../util/media/unlinkFiles'
import jupyterNotebookSimple from '../../__fixtures__/article/jupyter-notebook-simple'
import { fixture, nockRecord, snapshot } from '../../__tests__/helpers'
import { JsonCodec } from '../json'
import {
  decodeCodeCell,
  decodeMultilineString,
  encodeCodeChunk,
  encodeMultilineString,
  IpynbCodec,
} from './'
import * as nbformat4 from './nbformat-v4'

const ipynbCodec = new IpynbCodec()
const jsonCodec = new JsonCodec()

const eLifeArticle = 'article/journal/elife/50356.json'
const plosArticle = 'article/journal/plosone/0229075.json'

describe('decode', () => {
  describe('CodeChunk', () => {
    test('Empty', async () => {
      const cell: nbformat4.CodeCell = {
        cell_type: 'code',
        metadata: {},
        source: [],
        execution_count: 0,
        outputs: [],
      }
      expect(await decodeCodeCell(cell)).toEqual(undefined)
    })
    test('Empty source but has outputs', async () => {
      const cell: nbformat4.CodeCell = {
        cell_type: 'code',
        metadata: {},
        source: [],
        execution_count: 0,
        outputs: [
          {
            output_type: 'execute_result',
            execution_count: 1,
            data: {},
            metadata: {},
          },
        ],
      }
      expect(await decodeCodeCell(cell)).toBeDefined()
    })
  })

  test.each([
    'metadata-v4',
    'running-code',
    'sunspots',
    'well-switching',
    'meta-analysis',
    'altair',
  ])('%s', async (name) => {
    const done = await nockRecord(`nock-record-${name}.json`)
    expect(
      await jsonCodec.dump(
        // Remove Data URIs e.g. for ImageObjects generated from Plotly because
        // they differ by OS
        removeDataUris(
          // Unlink files to remove references to temporary files (which
          // will change between test runs)
          unlinkFiles(await ipynbCodec.read(fixture(name + '.ipynb')))
        )
      )
    ).toMatchFile(snapshot(name + '.json'))
    done()
  })
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
    // Remove large data URIs for easier comparison to snapshots
    expect(await ipynbCodec.dump(removeDataUris(node))).toMatchFile(
      snapshot(name + '.ipynb')
    )
  })
})

describe('encode+decode', () => {
  test('MultilineString', () => {
    const mls1 = ['Line1\n', 'Line2']
    const mls2 = 'Line1\nLine2'
    const str1 = 'Line1\nLine2'

    expect(decodeMultilineString(mls1)).toEqual(str1)
    expect(decodeMultilineString(mls2)).toEqual(str1)
    expect(encodeMultilineString(str1)).toEqual(mls1)
  })

  describe('CodeChunk', () => {
    test('Simple', async () => {
      const cell: nbformat4.CodeCell = {
        cell_type: 'code',
        metadata: {},
        source: ['code'],
        execution_count: 0,
        outputs: [],
      }
      const chunk = schema.codeChunk({
        programmingLanguage: 'python',
        text: 'code',
        meta: {
          execution_count: 0,
        },
      })
      expect(await decodeCodeCell(cell)).toEqual(chunk)
      expect(await encodeCodeChunk(chunk)).toEqual(cell)
    })

    test('With metadata', async () => {
      const cell: nbformat4.CodeCell = {
        cell_type: 'code',
        metadata: {
          id: 'id',
          label: 'label',
          caption: '### Title\n\nPara',
          other: 'foo',
        },
        source: ['code'],
        execution_count: 42,
        outputs: [],
      }
      const chunk = schema.codeChunk({
        programmingLanguage: 'python',
        text: 'code',
        id: 'id',
        label: 'label',
        caption: [
          schema.heading({
            content: ['Title'],
            depth: 3,
          }),
          schema.paragraph({
            content: ['Para'],
          }),
        ],
        meta: {
          execution_count: 42,
          other: 'foo',
        },
      })
      expect(await decodeCodeCell(cell)).toEqual(chunk)
      expect(await encodeCodeChunk(chunk)).toEqual(cell)
    })
  })

  // If last value in array is 'meta', test that metadata
  // is encoded and then decoded correctly in roundtrip.
  // Does not compare content because of loss of some structure
  // when encoding to IPYNB e.g. figure collections
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
      const { content: decodedContent, ...decodededRest } =
        decoded as schema.Article
      const { content: expectedContent, ...expectedRest } =
        node as schema.Article
      expect(decodededRest).toEqual(expectedRest)
    } else expect(decoded).toEqual(node)
  })
})
