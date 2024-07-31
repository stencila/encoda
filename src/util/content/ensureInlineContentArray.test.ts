import schema from '@stencila/schema'
import { ensureInlineContentArray } from './ensureInlineContentArray'

describe('Ensures an array of inline content', () => {
  const emph = schema.emphasis({ content: ['emphasised'] })
  const quote = schema.quote({ content: ['a quote'], cite: 'someone' })
  const para = schema.paragraph({ content: [emph, quote] })
  const quoteBlock = schema.quoteBlock({ content: [para] })

  test('returns inline content as is', () => {
    expect(ensureInlineContentArray(emph)).toEqual([emph])
    expect(ensureInlineContentArray([quote, emph])).toEqual([quote, emph])
  })

  test('unwraps the content property', () => {
    expect(ensureInlineContentArray(para)).toEqual(para.content)
    expect(ensureInlineContentArray([quoteBlock, 'three'])).toEqual([
      emph,
      quote,
      'three',
    ])
  })

  test('texifies block content that does not have the content property', () => {
    expect(
      ensureInlineContentArray([
        schema.thematicBreak(),
        schema.codeBlock({ text: 'Some code' }),
      ]),
    ).toEqual(['', 'Some code'])
  })
})
