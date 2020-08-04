/**
 * Tests for the structure and accessibility of the encoded HTML.
 *
 * For each test fixture:
 *
 * - test for correctness of structured data (ie. Microdata)
 * - test for accessibility
 * - write a file snapshot for inspection
 */

import * as schema from '@stencila/schema'
import os from 'os'
// @ts-ignore
import pa11y from 'pa11y'
// @ts-ignore
import { structuredDataTest } from 'structured-data-testing-tool'
// @ts-ignore
import { Article as ArticlePreset } from 'structured-data-testing-tool/presets/google/schemas/CreativeWork/Article'
import { HTMLCodec } from '.'
import { unlinkFiles } from '../../util/media/unlinkFiles'
import jupyterNotebookSimple from '../../__fixtures__/article/jupyter-notebook-simple'
import kitchenSinkArticle from '../../__fixtures__/article/kitchen-sink'
import mathArticle from '../../__fixtures__/article/math'
import rNotebookSimple from '../../__fixtures__/article/r-notebook-simple'
import {
  pythonCodeChunk,

  rCodeChunkImageOutput, rCodeExpression
} from '../../__fixtures__/code/kitchen-sink'
import { fixture, snapshot } from '../../__tests__/helpers'
import { JsonCodec } from '../json'

const jsonCodec = new JsonCodec()
const htmlCodec = new HTMLCodec()

const articles: [string, string | schema.Article, number][] = [
  ['kitchen-sink-article', kitchenSinkArticle, 1],
  ['math-article', mathArticle, 1],
  ['jupyter-notebook-simple', jupyterNotebookSimple, 1],
  ['r-notebook-simple', rNotebookSimple, 1],
  ['elife-50356', 'article/journal/elife/50356.json', 2],
  ['plosone-0229075', 'article/journal/plosone/0229075.json', 2],
]
describe('Articles', () => {
  test.each(articles)(
    '%s',
    async (name: string, article: string | schema.Article, level: number) => {
      const node =
        typeof article === 'string'
          ? await jsonCodec.read(fixture(article))
          : article
      // Unlink files to avoid dependency on which machine the test is running on
      const html = await htmlCodec.dump(await unlinkFiles(node), {
        // Standalone so get complete HTML doc with <head> etc
        isStandalone: true,
        // Test with the default stencila theme. This affects accessibility
        // tests such as `color-contrast`. We can test without a theme but
        // still get failures on such tests and the generated snapshots files
        // are not pleasant / realistic for visual checking by humans.
        theme: 'stencila',
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
                { type, test: 'Article[*].citation' },
              ]
            : []
        await structuredDataTest(html, {
          // Preset for Google Structured Data expectations
          // See https://developers.google.com/search/docs/data-types/article
          presets: [ArticlePreset],
          // Additional tests beyond what Google expects
          tests,
        })
      } catch (error) {
        if (error.type === 'VALIDATION_FAILED') {
          const {
            res: { failed },
          } = error
          failed.forEach((test: any) => fail(test.error.message))
        } else throw error
      }

      /**
       * The following accessibility tests fail when on Mac or in a Docker container on CI,
       * probably due to failure of pa11y to connect to Puppeteer.
       * So skip when in that situation.
       * See:
       *   - https://dev.azure.com/stencila/stencila/_build/results?buildId=3936&view=logs&j=4420cb5a-3e60-5d7c-f139-f152148f0805&t=e0f33437-cdeb-5531-d1ec-78693af04887&l=1700
       *   - https://dev.azure.com/stencila/stencila/_build/results?buildId=824&view=logs&j=bdfe1ee2-0dfa-5214-b354-014a2d5aae2e&t=95f41a85-677a-5e68-afba-63ba0e2792c1&l=1091
       */
      if (os.type() == 'Darwin' || process.env.DOCKER === 'true') return

      // Accessibility test
      // Rules to ignore (add rule codes here if you need to during development)
      const ignoreCodes: string[] = [
        // Skip color contrast related checks (will probably have
        // these checks in Thema)
        'color-contrast',
        'WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.Fail',
        'WCAG2AA.Principle1.Guideline1_3.1_3_1.H39.3.LayoutTable',
      ]
      // Temporarily skip Web Component structure (not controlled by this repo)
      // See https://github.com/stencila/designa/issues/37
      const ignoreSelectorRegex = /stencila-code-chunk/

      const { issues = [] } = await pa11y(file, { runners: ['axe', 'htmlcs'] })
      issues.forEach((result: any) => {
        const { type, selector, code, message } = result
        if (
          type === 'error' &&
          !ignoreSelectorRegex.test(selector) &&
          !ignoreCodes.includes(code)
        )
          fail(`${selector}: ${code}: ${message}`)
      })
    }
  )
})

const nodes: [string, schema.Node][] = [
  ['python-code-chunk', pythonCodeChunk],
  ['r-code-expression', rCodeExpression],
  ['r-code-chunk-image-output', rCodeChunkImageOutput],
]
describe('General nodes', () => {
  test.each(nodes)('%s', async (name: string, node: schema.Node) => {
    // Unlink files to avoid dependency on which machine the test is running on
    const html = await htmlCodec.dump(await unlinkFiles(node), {
      // Standalone so get complete HTML doc with <head> etc
      // for checking rendering of Web Components for these nodes.
      isStandalone: true,
    })
    const file = snapshot(`${name}.html`)
    expect(html).toMatchFile(file)
  })
})
