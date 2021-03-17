import {
  Article,
  article,
  Cite,
  cite,
  CiteGroup,
  citeGroup,
  mathBlock,
  paragraph,
  Paragraph,
} from '@stencila/schema'
import articleSimple from '../../__fixtures__/article/simple'
import { fixture, snapshot } from '../../__tests__/helpers'
import { JsonCodec } from '../json'
import { LatexCodec } from './'

const jsonCodec = new JsonCodec()
const latexCodec = new LatexCodec()

test('invertible', async () => {
  await expect(latexCodec).toInvert(articleSimple)
})

describe('fixtures', () => {
  test('kitchen-sink.tex', async () => {
    const node = await latexCodec.read(fixture('kitchen-sink.tex'), {
      shouldCoerce: false,
      shouldReshape: false,
    })
    expect(await jsonCodec.dump(node)).toMatchFile(
      snapshot('kitchen-sink.json')
    )
  })

  test('code.tex', async () => {
    const node = await latexCodec.read(fixture('code.tex'))
    expect(await jsonCodec.dump(node)).toMatchFile(snapshot('code.json'))
  })
})

test('decoding multiple lines of text', async () => {
  const node = await latexCodec.load(`
This is some text
spread over multiple lines.
And we want to have a space after that last period.
  `)
  expect(node).toEqual(
    article({
      content: [
        paragraph({
          content: [
            `This is some text spread over multiple lines. And we want to have a space after that last period.`,
          ],
        }),
      ],
    })
  )
})

test('decode equation with label to MathBlock with id (as for Table and Figure)', async () => {
  const node = await latexCodec.load(`
\\begin{equation}
  \\text{E}[x] = \\frac{1.0}{1.0}
  \\label{eq:eq1}
\\end{equation}`)
  expect(node).toEqual(
    article({
      content: [
        mathBlock({
          text: `\\text{E}[x] = \\frac{1.0}{1.0}`,
          id: 'eq:eq1',
        }),
      ],
    })
  )
})

/**
 * See https://www.overleaf.com/learn/latex/natbib_citation_styles
 */
describe('natbib citation commands', () => {
  // Helper function to load LaTeX and get the `CiteGroup` node from within it
  const load = async (latex: string): Promise<Cite | CiteGroup> => {
    const article = (await latexCodec.load(latex)) as Article
    const paragraph = article.content?.[0] as Paragraph
    return paragraph.content[0] as Cite | CiteGroup
  }

  // Parenthetical notation (citationMode defaults to this)
  test('citep', async () => {
    const node = await load(`\\citep{ref1}`)
    expect(node).toEqual(
      cite({
        target: 'ref1',
      })
    )
  })

  // Parenthetical notation with prefix, multiple citations, and suffix
  test('citep:multiple', async () => {
    const node = await load(`\\citep{ref1, ref2, ref3}`)
    expect(node).toEqual(
      citeGroup({
        items: [
          cite({ target: 'ref1' }),
          cite({ target: 'ref2' }),
          cite({ target: 'ref3' }),
        ],
      })
    )
  })

  // Parenthetical notation with prefix, multiple citations, and suffix
  test('citep:prefix,suffix', async () => {
    const node = await load(`\\citep[e.g.][and others]{ref1, ref2}`)
    expect(node).toEqual(
      citeGroup({
        items: [
          cite({ prefix: 'e.g.', target: 'ref1' }),
          cite({ target: 'ref2', suffix: 'and others' }),
        ],
      })
    )
  })

  // The same as \citep but if there are several authors, all names are printed
  // This is a presentational variation that we deal with in article themes,
  // rather than here.
  test('citep*', async () => {
    const node = await load(`\\citep*{ref1}`)
    expect(node).toEqual(
      cite({
        target: 'ref1',
      })
    )
  })

  // Textual notation
  test('citet', async () => {
    const node = await load(`\\citet{ref1}`)
    expect(node).toEqual(
      cite({
        citationMode: 'narrative',
        target: 'ref1',
      })
    )
  })

  // Same as \citet but if there are several authors, all names are printed
  // As above, not dealt with here.
  test('citet*', async () => {
    const node = await load(`\\citet*{ref1}`)
    expect(node).toEqual(
      cite({
        citationMode: 'narrative',
        target: 'ref1',
      })
    )
  })

  // \citeauthor prints only the name of the authors(s)
  // Not supported by Pandoc (?) so falls back to `narrative` mode
  // instead of `narrative-author`.
  test('citeauthor', async () => {
    const node = await load(`\\citeauthor{ref1}`)
    expect(node).toEqual(
      cite({
        citationMode: 'narrative',
        target: 'ref1',
      })
    )
  })

  // \citeyear prints only the year of the publication.
  test('citeyear', async () => {
    const node = await load(`\\citeyear{ref1}`)
    expect(node).toEqual(
      cite({
        citationMode: 'narrative-year',
        target: 'ref1',
      })
    )
  })
})
