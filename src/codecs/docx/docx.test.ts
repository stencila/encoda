import { replaceHandlers, LogLevel } from '@stencila/logga'
import jupyterNotebookSimple from '../../__fixtures__/article/jupyter-notebook-simple'
import kitchenSinkArticle from '../../__fixtures__/article/kitchen-sink'
import mathArticle from '../../__fixtures__/article/math'
import rNotebookSimple from '../../__fixtures__/article/r-notebook-simple'
import simpleArticle from '../../__fixtures__/article/simple'
import { fixture, snapshot } from '../../__tests__/helpers'
import { JsonCodec } from '../json'
import { DocxCodec } from './'

const docxCodec = new DocxCodec()
const jsonCodec = new JsonCodec()

// Capture log warning messages to test against expectations
// Note that the logs are shared across all fixtures
const logMessages: string[] = []
beforeAll(() => {
  replaceHandlers(({ level, message }) => {
    if (level === LogLevel.warn && !logMessages.includes(message))
      logMessages.push(message)
  })
})

const articles = [
  ['simple-article', simpleArticle, true],
  // These articles currently have loss on decoding
  // so these tests just check that encoding does not fail
  ['kitchen-sink-article', kitchenSinkArticle, false],
  ['jupyter-notebook-simple', jupyterNotebookSimple, false],
  ['r-notebook-simple', rNotebookSimple, false],
  ['math-article', mathArticle, false],
  ['math-article', mathArticle, false],
  ['elife-50356', 'article/journal/elife/50356.json', false],
  ['plosone-0229075', 'article/journal/plosone/0229075.json', false],
]
describe('encode+decode', () => {
  test.each(articles)('%s', async (name, article, decode) => {
    const node =
      typeof article === 'string'
        ? await jsonCodec.read(fixture(article))
        : article
    const file = snapshot(`${name}.docx`)

    // Write a DOCX file for human inspection
    await docxCodec.write(node, file)

    // For some articles, also test that the file can be successfully
    // read back to the original node
    if (decode) {
      const reversed = await docxCodec.read(file)
      expect(reversed).toEqual(article)
    }
  })

  test('logs have expected warnings only', () => {
    expect(logMessages).toEqual([
      'csl:encode Properties of `Article` not supported: `identifiers`',
      'Falling back to default encoding for inline node type MediaObject.',
      'Unhandled inline node type when encoding: MediaObject',
    ])
  })
})
