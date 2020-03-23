/**
 * Tests for the structure and accessibility of the encoded HTML.
 *
 * For each test fixture:
 *
 * - test for correctness of structured data (ie. Microdata)
 * - test for accessibility
 * - write a file snapshot for inspection
 */

// @ts-ignore
import pa11y from 'pa11y'
// @ts-ignore
import { structuredDataTest } from 'structured-data-testing-tool'
// @ts-ignore
import { Article as ArticlePreset } from 'structured-data-testing-tool/presets/google/schemas/CreativeWork/Article'
import { HTMLCodec } from '.'
import { unlinkFiles } from '../../util/media/unlinkFiles'
import kitchenSinkArticle from '../../__fixtures__/article/kitchen-sink'
import mathArticle from '../../__fixtures__/article/math'
import { fixture, snapshot } from '../../__tests__/helpers'
import { JsonCodec } from '../json'

const jsonCodec = new JsonCodec()
const htmlCodec = new HTMLCodec()

const articles = [
  ['kitchen-sink-article', kitchenSinkArticle, 1],
  ['math-article', mathArticle, 1],
  ['elife-50356', 'article/journal/elife/50356.json', 2],
  ['plosone-0229075', 'article/journal/plosone/0229075.json', 2]
]
describe('Articles', () => {
  test.each(articles)('%s', async (name, article, level) => {
    const node =
      typeof article === 'string'
        ? await jsonCodec.read(fixture(article))
        : article
    // Unlink files to avoid dependency on which machine the test is running on
    const html = await htmlCodec.dump(await unlinkFiles(node), {
      // Standalone so get complete HTML doc with <head> etc
      isStandalone: true,
      // No theme, to make faster and so that tests are not affected by
      // accessibility issues in themes e.g. color contrast
      theme: undefined
    })
    const file = snapshot(`${name}.html`)

    // Regression / human inspection test.
    // Snapshot also used by pa11y below
    expect(html).toMatchFile(file)

    // Structured data test
    try {
      // Which additional tests depend on the 'level' argument
      // (based on the content of the article)
      const type = 'microdata'
      const tests =
        level > 1
          ? [
              { type, test: 'Article[*].author[0].affiliation' },
              { type, test: 'Article[*].citation' }
            ]
          : []
      await structuredDataTest(html, {
        // Preset for Google Structured Data expectations
        // See https://developers.google.com/search/docs/data-types/article
        presets: [ArticlePreset],
        // Additional tests beyond what Google expects
        tests
      })
    } catch (error) {
      if (error.type === 'VALIDATION_FAILED') {
        const {
          res: { failed }
        } = error
        failed.forEach((test: any) => fail(test.error.message))
      } else throw error
    }

    /**
     * This following fails when in a Docker container on CI,
     * probably due to failure of pa11y to connect to Puppeteer.
     * So skip when in that situation.
     * See: https://dev.azure.com/stencila/stencila/_build/results?buildId=824&view=logs&j=bdfe1ee2-0dfa-5214-b354-014a2d5aae2e&t=95f41a85-677a-5e68-afba-63ba0e2792c1&l=1091
     */
    if (process.env.DOCKER === 'true') return

    // Accessibility test
    // Rules to ignore (add rule codes here if you need to during development)
    const ignore: string[] = []
    const { issues = [] } = await pa11y(file, { runners: ['axe', 'htmlcs'] })
    issues.forEach((result: any) => {
      const { type, selector, code, message } = result
      if (type === 'error' && !ignore.includes(code))
        fail(`${selector}: ${code}: ${message}`)
    })
  })
})
