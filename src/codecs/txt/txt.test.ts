import stencila from '@stencila/schema'
import path from 'path'
import { TxtCodec } from '.'
import { dump, load, read } from '../../util/vfile'

const txt = new TxtCodec()
const { decode, encode } = new TxtCodec()

describe('decode', () => {
  const d = async (content: string) => await decode(await load(content))

  it('decodes string representations of primitive nodes', async () => {
    expect(await d('null')).toBe(null)
    expect(await d('true')).toBe(true)
    expect(await d('false')).toBe(false)
    expect(await d('1')).toBe(1)
    expect(await d('3.14')).toBe(3.14)
    expect(await d(' 3.14 ')).toBe(' 3.14 ')
    expect(await d('string')).toBe('string')
  })

  it('can decode a plain ASCII text file', async () => {
    expect(
      await decode(
        await read(path.join(__dirname, '__fixtures__', 'ascii.txt'))
      )
    ).toBe('Just some plain ASCII text.\n')
  })

  it('can decode a UTF8 text file', async () => {
    expect(
      await decode(await read(path.join(__dirname, '__fixtures__', 'utf8.txt')))
    ).toBe('ეს არის ქართულ ენაზე დაწერილი უნიკოდში.\n')
  })
})

describe('encode', () => {
  const e = async (node: stencila.Node) => await dump(await encode(node))

  it('encodes primitives as strings', async () => {
    expect(await e(null)).toBe('null')
    expect(await e(true)).toBe('true')
    expect(await e(false)).toBe('false')
    expect(await e(1)).toBe('1')
    expect(await e(3.14)).toBe('3.14')
    expect(await e('string')).toBe('string')
  })

  it('encodes arrays as space separated strings', async () => {
    expect(await e([])).toBe('')
    expect(await e([1])).toBe('1')
    expect(await e([null, true, 42, 'str', 3.14])).toBe('null true 42 str 3.14')
  })

  it('encodes objects as space separated key value pairs', async () => {
    expect(await e({})).toBe('')
    expect(await e({ a: 1 })).toBe('a 1')
    expect(await e({ a: null, b: true, c: 42, d: 'str', e: 3.14 })).toBe(
      'a null b true c 42 d str e 3.14'
    )
  })

  it('encodes nested objects / arrays', async () => {
    expect(await e(article)).toBe(articleString)
  })
})

describe('invertibility', () => {
  it('is able to invert primitive nodes', async () => {
    expect(txt).toInvert(null)
    expect(txt).toInvert(true)
    expect(txt).toInvert(false)
    expect(txt).toInvert(3.14)
    expect(txt).toInvert(-100)
    expect(txt).toInvert('3.14string')
    expect(txt).toInvert('a string')
  })

  it('is not able to invert objects or arrays', async () => {
    expect(txt).not.toInvert([1, 2, 3])
    expect(txt).not.toInvert({ a: 1, b: 2 })
  })
})

const article: stencila.Article = {
  type: 'Article',
  title: 'My simple article',
  authors: [
    {
      type: 'Person',
      givenNames: ['Peter'],
      familyNames: ['Pan']
    }
  ],
  content: [
    {
      type: 'Paragraph',
      content: ['My first paragraph.']
    }
  ]
}

const articleString =
  'type Article title My simple article authors type Person givenNames Peter familyNames Pan content type Paragraph content My first paragraph.'
