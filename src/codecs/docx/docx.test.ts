import { addHandler, LogData, LogLevel } from '@stencila/logga'
import kitchenSinkArticle from '../../__fixtures__/article/kitchen-sink'
import mathArticle from '../../__fixtures__/article/math'
import simpleArticle from '../../__fixtures__/article/simple'
import { fixture, snapshot } from '../../__tests__/helpers'
import { JsonCodec } from '../json'
import { DocxCodec } from './'

const docxCodec = new DocxCodec()
const jsonCodec = new JsonCodec()

// Capture log warning messages to test against expectations
// Note that this is just done across all fixtures
const logMessages: string[] = []
beforeAll(() => {
  addHandler(({ level, message }) => {
    if (level === LogLevel.warn && !logMessages.includes(message))
      logMessages.push(message)
  })
})

const articles = [
  ['simple-article', simpleArticle, true],
  // These articles currently have loss on decoding
  // so these tests just check that encoding does not fail
  ['kitchen-sink-article', kitchenSinkArticle, false],
  ['math-article', mathArticle, false],
  ['math-article', mathArticle, false],
  ['elife-50356', 'article/journal/elife/50356.json', false],
  ['plosone-0229075', 'article/journal/plosone/0229075.json', false]
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

    // For some, also that the file can be successfully
    // read back to the original node
    if (decode) {
      const reversed = await docxCodec.read(file)
      expect(reversed).toEqual(article)
    }
  })

  test('logs have expected warnings only', () => {
    expect(logMessages).toEqual([
      'Unhandled block node type when encoding: Text',
      'csl Properties of `Article` not supported by encode: `pageEnd`, `pageStart`',
      'csl Properties of `PublicationVolume` not supported by encode: `isPartOf`',
      'Unhandled block node type when encoding: Collection',
      'Unhandled block node type when encoding: Figure',
      'csl:encode Unhandled isPartOf type: PublicationIssue',
      'csl Properties of `Article` not supported by encode: `pageStart`',
      'csl:encode Unhandled isPartOf type: Periodical',
      'Unhandled block node type when encoding: MediaObject'
    ])
  })
})
