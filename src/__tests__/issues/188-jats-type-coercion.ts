import schema from '@stencila/schema'
import { JatsCodec } from '../../codecs/jats'
import { JsonCodec } from '../../codecs/json'
import { snapshot } from '../helpers'

const jatsCodec = new JatsCodec()
const jsonCodec = new JsonCodec()

/**
 * https://github.com/stencila/encoda/issues/188
 *
 * "the number 1, if unquoted, gets converted to boolean true"
 */
test('188-type-coercion-weirdness', async () => {
  const json = `{
  "type": "Table",
  "rows": [
    {
      "type": "TableRow",
      "cells": [
        {
          "type": "TableCell",
          "content": [
            1
          ]
        },
        {
          "type": "TableCell",
          "content": [
            "2"
          ]
        }
      ]
    },
    {
      "type": "TableRow",
      "cells": [
        {
          "type": "TableCell",
          "content": [
            "1"
          ]
        },
        {
          "type": "TableCell",
          "content": [
            "2"
          ]
        }
      ]
    }
  ]
}`
  const table = (await jsonCodec.load(json)) as schema.Table

  expect(table?.rows?.[0].cells?.[0].content?.[0]).toBe(1)
  expect(table?.rows?.[0].cells?.[1].content?.[0]).toBe('2')

  expect(await jatsCodec.dump(table)).toMatchFile(
    snapshot('188-type-coercion.jats.xml')
  )
})
