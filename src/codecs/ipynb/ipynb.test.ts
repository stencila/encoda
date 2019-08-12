import * as stencila from '@stencila/schema'
import path from 'path'
import { dump, load, read } from '../../util/vfile'
import { decodeMultilineString, encodeMultilineString, IPyNbCodec } from './'
import nbformat3 from './nbformat-v3'
import nbformat4 from './nbformat-v4'

const { decode, encode } = new IPyNbCodec()

test('decode', async () => {
  const d = async (ipynb: nbformat3.Notebook | nbformat4.Notebook) =>
    await decode(await load(JSON.stringify(ipynb)))

  expect(await d(kitchenSink.from)).toEqual(kitchenSink.node)
})

test('decode files', async () => {
  const d = async (ipynb: string) =>
    await decode(await read(path.join(__dirname, '__fixtures__', ipynb)))

  // TODO: Add expectations! Currently this just checks that the
  // fixtures are read without failing.
  await d('running-code.ipynb')
  await d('sunspots.ipynb')
  await d('well-switching.ipynb')
})

test('encode', async () => {
  const e = async (node: stencila.Node) =>
    JSON.parse(await dump(await encode(node)))

  expect(await e(kitchenSink.node)).toEqual(kitchenSink.from)
})

test('encode+decode MultilineString', () => {
  const mls1 = ['Line1\n', 'Line2']
  const mls2 = 'Line1\nLine2'
  const str1 = 'Line1\nLine2'

  expect(decodeMultilineString(mls1)).toEqual(str1)
  expect(decodeMultilineString(mls2)).toEqual(str1)
  expect(encodeMultilineString(str1)).toEqual(mls1)
})

interface TestCase {
  from: nbformat3.Notebook | nbformat4.Notebook
  node: stencila.Article
  to?: nbformat4.Notebook
}

// An example intended for testing progressively added decoding/encoding pairs
const kitchenSink: TestCase = {
  from: {
    cells: [
      {
        cell_type: 'markdown',
        metadata: {},
        source: ['# Heading 1\n', '\n', 'A markdown cell with some text.']
      },
      {
        cell_type: 'code',
        execution_count: 4,
        metadata: {},
        outputs: [],
        source: ["greeting = 'Hello from Python'"]
      },
      {
        cell_type: 'markdown',
        metadata: {},
        source: ['## Heading 1.1\n', '\n', 'An other markdown cell.']
      },
      {
        cell_type: 'code',
        execution_count: 6,
        metadata: {},
        outputs: [
          {
            text: 'Hello from Python 3',
            output_type: 'stream',
            name: 'stdout'
          }
        ],
        source: [
          'import sys\n',
          "print(greeting + ' ' + str(sys.version_info[0]))"
        ]
      }
    ],
    metadata: {
      title: 'Jupyter notebook title',
      authors: [],
      kernelspec: {
        display_name: 'Python 3',
        language: 'python',
        name: 'python3'
      },
      language_info: {
        codemirror_mode: {
          name: 'ipython',
          version: 3
        },
        file_extension: '.py',
        mimetype: 'text/x-python',
        name: 'python',
        nbconvert_exporter: 'python',
        pygments_lexer: 'ipython3',
        version: '3.6.4'
      },
      orig_nbformat: 1
    },
    nbformat: 4,
    nbformat_minor: 4
  },
  node: {
    type: 'Article',
    title: 'Jupyter notebook title',
    authors: [],
    meta: {
      kernelspec: {
        display_name: 'Python 3',
        language: 'python',
        name: 'python3'
      },
      language_info: {
        codemirror_mode: {
          name: 'ipython',
          version: 3
        },
        file_extension: '.py',
        mimetype: 'text/x-python',
        name: 'python',
        nbconvert_exporter: 'python',
        pygments_lexer: 'ipython3',
        version: '3.6.4'
      },
      orig_nbformat: 1
    },
    content: [
      {
        type: 'Heading',
        depth: 1,
        content: ['Heading 1']
      },
      {
        type: 'Paragraph',
        content: ['A markdown cell with some text.']
      },
      {
        type: 'CodeChunk',
        meta: { execution_count: 4 },
        text: "greeting = 'Hello from Python'"
      },
      {
        type: 'Heading',
        depth: 2,
        content: ['Heading 1.1']
      },
      {
        type: 'Paragraph',
        content: ['An other markdown cell.']
      },
      {
        type: 'CodeChunk',
        meta: { execution_count: 6 },
        text: "import sys\nprint(greeting + ' ' + str(sys.version_info[0]))",
        outputs: ['Hello from Python 3']
      }
    ]
  }
}
