import { article, mathBlock, paragraph } from '@stencila/schema'
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
  test('test1.tex', async () => {
    const test1 = await latexCodec.read(fixture('test1.tex'), {
      shouldCoerce: false,
      shouldReshape: false,
    })
    expect(await jsonCodec.dump(test1)).toMatchFile(snapshot('test1.json'))
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
