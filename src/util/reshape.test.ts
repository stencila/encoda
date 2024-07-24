import schema from '@stencila/schema'

import { groupCitesIntoCiteGroup } from './reshape'


describe('groupCitesIntoGiteGroup', () => {
  test('single parenthetical Cite has extraneous parentheses removed', () => {
    const before = [
      'this is (ignored) because its in text, and so is this math (',
      schema.mathFragment({ text: 'pi' }),
      ') but (',
      schema.cite({ target: 'a' }),
      ') is not.',
    ]
    const after = [
      'this is (ignored) because its in text, and so is this math (',
      schema.mathFragment({ text: 'pi' }),
      ') but ',
      schema.cite({ target: 'a' }),
      ' is not.',
    ]

    expect(groupCitesIntoCiteGroup(before)).toEqual(after)
  })

  test('two CiteGroups with two and three Cites each', () => {
    const before = [
      'first (',
      schema.cite({ target: 'a' }),
      '; ',
      schema.cite({ target: 'b' }),
      ') second (',
      schema.cite({ target: 'c' }),
      '; ',
      schema.cite({ target: 'd' }),
      ' ; ',
      schema.cite({ target: 'e' }),
      ').',
    ]
    const after = [
      'first ',
      schema.citeGroup({
        items: [schema.cite({ target: 'a' }), schema.cite({ target: 'b' })],
      }),
      ' second ',
      schema.citeGroup({
        items: [
          schema.cite({ target: 'c' }),
          schema.cite({ target: 'd' }),
          schema.cite({ target: 'e' }),
        ],
      }),
      '.',
    ]

    expect(groupCitesIntoCiteGroup(before)).toEqual(after)
  })
})
