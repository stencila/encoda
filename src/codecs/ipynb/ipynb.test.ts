import * as stencila from '@stencila/schema'
import {
  decode,
  decodeMultilineString,
  encode,
  encodeMultilineString,
  nbformat
} from './'
import { dump, load } from '../../vfile'

test('decode', async () => {
  const decode_ = async (ipynb: nbformat.INotebookContent) =>
    await decode(await load(JSON.stringify(ipynb)))

  expect(await decode_(kitchenSink.ipynb)).toEqual(kitchenSink.node)
})

test('encode', async () => {
  const encode_ = async (node: stencila.Node) =>
    JSON.parse(await dump(await encode(node)))

  expect(await encode_(kitchenSink.node)).toEqual(kitchenSink.ipynb)
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
  ipynb: nbformat.INotebookContent
  node: stencila.Article
}

// An example intended for testing progressively added decoding/encoding pairs
const kitchenSink: TestCase = {
  ipynb: {
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
            metadata: {},
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
