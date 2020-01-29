// @ts-ignore
import { structuredDataTest } from 'structured-data-testing-tool'
// @ts-ignore
import { Article as ArticlePreset } from 'structured-data-testing-tool/presets/google/schemas/CreativeWork/Article'
import { HTMLCodec } from '.'
import { readFixture } from '../../__tests__/helpers'
import { JsonCodec } from '../json'

const json = new JsonCodec()
const html = new HTMLCodec()

const json2html = async (name: string) =>
  html.dump(await json.decode(await readFixture(name)))

describe.skip('Microdata for scholarly Articles', () => {
  const has = (jmespath: string, expect: string | true = true) => ({
    test: jmespath,
    type: 'microdata',
    expect
  })

  const options = {
    // Preset for Google Structured Data expectations
    // See https://developers.google.com/search/docs/data-types/article
    presets: [ArticlePreset],
    // Additional tests beyond what Google expects
    tests: [has('Article[*].author[0].affiliation'), has('Article[*].citation')]
  }

  test.each(['article/journal/elife/50356.json'])('Test %p', async fixture => {
    const html = await json2html('article/journal/elife/50356.json')
    try {
      await structuredDataTest(html, options)
    } catch (error) {
      if (error.type === 'VALIDATION_FAILED') {
        const {
          res: { failed }
        } = error
        failed.forEach((test: any) => console.error(test))
      }
      throw error
    }
  })
})
