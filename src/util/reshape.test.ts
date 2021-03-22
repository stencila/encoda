import * as schema from '@stencila/schema'

import { MdCodec } from '../codecs/md'
import { YamlCodec } from '../codecs/yaml'
import { fixture, nockRecord, snapshot } from '../__tests__/helpers'
import { groupCitesIntoGiteGroup } from './reshape'

const mdCodec = new MdCodec()
const yamlCodec = new YamlCodec()

test('reshape', async () => {
  const done = await nockRecord('nock-record-reshape.json')

  const reshaped = await mdCodec.read(fixture('reshape-1.md'), {
    shouldReshape: true,
  })
  expect(await yamlCodec.dump(reshaped)).toMatchFile(
    snapshot('reshape-1-reshaped.yaml')
  )
  expect(await mdCodec.dump(reshaped)).toMatchFile(
    snapshot('reshape-1-reshaped.md')
  )

  done()
})

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

    expect(groupCitesIntoGiteGroup(before)).toEqual(after)
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

    expect(groupCitesIntoGiteGroup(before)).toEqual(after)
  })
})
