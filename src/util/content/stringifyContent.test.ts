import * as stencila from '@stencila/schema'
import { stringifyContent } from './stringifyContent'

describe('stringifyContent', () => {
  test('it stringifies primitives', () => {
    expect(stringifyContent([null, true, false, NaN, 2, 'string'])).toEqual(
      'nulltruefalseNaN2string'
    )
  })

  test('it stringifies object values', () => {
    expect(stringifyContent({ a: 1, b: 'two', c: null })).toEqual('1twonull')
  })

  test('it stringifies inline content', () => {
    expect(
      stringifyContent([
        stencila.emphasis(['emphasis']),
        stencila.strong(['strong']),
        stencila.subscript(['sub']),
        stencila.superscript(['sup'])
      ])
    ).toEqual('emphasisstrongsubsup')
  })

  test('it stringifies block content', () => {
    expect(
      stringifyContent(
        stencila.paragraph([
          'A paragraph with ',
          stencila.strong(['strong']),
          ' and ',
          stencila.strong([stencila.superscript(['super strong'])])
        ])
      )
    ).toEqual('A paragraph with strong and super strong')
  })
})
