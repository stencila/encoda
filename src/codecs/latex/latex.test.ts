import { article, paragraph } from '@stencila/schema'
import articleSimple from '../../__fixtures__/article/simple'
import { fixture, snapshot } from '../../__tests__/helpers'
import { JsonCodec } from '../json'
import { LatexCodec } from './'

const jsonCodec = new JsonCodec()
const latexCodec = new LatexCodec()

test('invertible', async () => {
  await expect(latexCodec).toInvert(articleSimple)
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

describe('fixtures', () => {
  test('test1.tex', async () => {
    const test1 = await latexCodec.read(fixture('test1.tex'), {
      shouldCoerce: false,
      shouldReshape: false,
    })
    expect(await jsonCodec.dump(test1)).toMatchFile(snapshot('test1.json'))
  })
})
