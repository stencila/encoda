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
        stencila.emphasis({ content: ['emphasis'] }),
        stencila.strong({ content: ['strong'] }),
        stencila.subscript({ content: ['sub'] }),
        stencila.superscript({ content: ['sup'] })
      ])
    ).toEqual('emphasisstrongsubsup')
  })

  test('it stringifies block content', () => {
    expect(
      stringifyContent(
        stencila.paragraph({
          content: [
            'A paragraph with ',
            stencila.strong({ content: ['strong'] }),
            ' and ',
            stencila.strong({
              content: [stencila.superscript({ content: ['super strong'] })]
            })
          ]
        })
      )
    ).toEqual('A paragraph with strong and super strong')
  })
})
