/**
 * Regression tests for encoding to Markdown.
 * See `./md.test.ts` for unit tests, including for decoding.
 */

import * as schema from '@stencila/schema'
import { MdCodec } from '.'
import { unlinkFiles } from '../../util/media/unlinkFiles'
import jupyterNotebookSimple from '../../__fixtures__/article/jupyter-notebook-simple'
import kitchenSinkArticle from '../../__fixtures__/article/kitchen-sink'
import rNotebookSimple from '../../__fixtures__/article/r-notebook-simple'
import { fixture, snapshot } from '../../__tests__/helpers'
import { JsonCodec } from '../json'

const jsonCodec = new JsonCodec()
const mdCodec = new MdCodec()

const articles: [string, string | schema.Article][] = [
  ['kitchen-sink-article', kitchenSinkArticle],
  ['jupyter-notebook-simple', jupyterNotebookSimple],
  ['r-notebook-simple', rNotebookSimple],
  ['elife-50356', 'article/journal/elife/50356.json'],
  ['plosone-0229075', 'article/journal/plosone/0229075.json'],
]
describe('Articles', () => {
  test.each(articles)(
    '%s',
    async (name: string, article: string | schema.Article) => {
      const node =
        typeof article === 'string'
          ? await jsonCodec.read(fixture(article))
          : article
      // Unlink files to avoid dependency on which machine the test is running on
      const md = await mdCodec.dump(await unlinkFiles(node))
      const file = snapshot(`${name}.md`)

      // Regression / human inspection test.
      // Snapshot also used by pa11y below
      expect(md).toMatchFile(file)
    }
  )
})
