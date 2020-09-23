import {
  article,
  codeChunk,
  date,
  heading,
  paragraph,
  person,
} from '@stencila/schema'

/**
 * An `Article` representing a simple Jupyter Python notebook: has
 * some `CodeChunk`s and prose content nodes and meta-data
 * required by Jupyter.
 */
export default article({
  title: 'Jupyter notebook title',
  authors: [
    person({
      name: 'A. Jovian',
    }),
  ],
  datePublished: date({ value: '2020-04-01' }),
  meta: {
    kernelspec: {
      display_name: 'Python 3',
      language: 'python',
      name: 'python3',
    },
    language_info: {
      codemirror_mode: {
        name: 'ipython',
        version: 3,
      },
      file_extension: '.py',
      mimetype: 'text/x-python',
      name: 'python',
      nbconvert_exporter: 'python',
      pygments_lexer: 'ipython3',
      version: '3.6.4',
    },
    orig_nbformat: 1,
  },
  content: [
    heading({
      depth: 1,
      content: ['Heading 1'],
    }),
    paragraph({
      content: ['A markdown cell with some text.'],
    }),
    codeChunk({
      meta: {
        execution_count: 4,
      },
      programmingLanguage: 'python',
      text: "greeting = 'Hello from Python'",
    }),
    heading({
      depth: 2,
      content: ['Heading 1.1'],
    }),
    paragraph({
      content: ['An other markdown cell.'],
    }),
    codeChunk({
      meta: {
        execution_count: 6,
      },
      programmingLanguage: 'python',
      text: "import sys\nprint(greeting + ' ' + str(sys.version_info[0]))",
      outputs: ['Hello from Python 3'],
    }),
  ],
})
