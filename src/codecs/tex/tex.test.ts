import { schema } from '@stencila/jesta'
import { TexCodec } from '.'
import {
  asciimathBlock,
  asciimathFragment,
  mathmlBlock,
  mathmlFragment,
  mathmlString,
  texBlock,
  texFragment,
  texString,
  texBlockString,
} from '../../__fixtures__/math/kitchen-sink'

const tex = new TexCodec()

describe('decode', () => {
  const decode = (content: string) => tex.load(content)

  test('success', async () => {
    expect(await decode(texString)).toEqual(
      schema.mathFragment({ mathLanguage: 'tex', text: texString })
    )
    expect(await decode(texBlockString)).toEqual(
      schema.mathBlock({ mathLanguage: 'tex', text: texBlockString })
    )
  })

  test('failure', async () => {
    expect(await decode('')).toEqual(
      schema.mathFragment({ mathLanguage: 'tex', text: '' })
    )
  })
})

describe('encode', () => {
  const encode = (node: schema.Math) => tex.dump(node)

  test('success', async () => {
    expect(await encode(texFragment)).toEqual(texString)
    expect(await encode(texBlock)).toEqual(texString)

    expect(await encode(asciimathFragment)).toMatch('E = m c^{2}')
    expect(await encode(asciimathBlock)).toMatch('E = m c^{2}')

    expect(await encode(mathmlFragment)).toMatch('E=m{c}^{2}')
    expect(await encode(mathmlBlock)).toMatch('E=m{c}^{2}')

    // No `mathLanguage`, assumed to be `tex`
    expect(await encode(schema.mathFragment({ text: texString }))).toMatch(
      'E = mc^2'
    )
  })

  test('failure', async () => {
    expect(
      await encode(
        // @ts-ignore
        schema.article()
      )
    ).toMatch('')

    expect(
      await encode(schema.mathFragment({ mathLanguage: 'foo', text: '' }))
    ).toMatch('')
  })
})
