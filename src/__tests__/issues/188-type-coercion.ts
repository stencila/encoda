import * as stencila from '@stencila/schema'
import { JatsCodec } from '../../codecs/jats'
import { JsonCodec } from '../../codecs/json'
import { MdCodec } from '../../codecs/md'
import { snapshot } from '../helpers'

const jatsCodec = new JatsCodec()
const jsonCodec = new JsonCodec()
const mdCodec = new MdCodec()

test('JSON strings should not get converted to numbers', async () => {
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
  const table = await jsonCodec.load(json) as stencila.Table

  expect(table?.rows?.[0].cells?.[0].content[0]).toBe(1)
  expect(table?.rows?.[0].cells?.[1].content[0]).toBe("2")

  expect(await jsonCodec.dump(table)).toEqual(json)
  expect(await mdCodec.dump(table)).toMatchFile(
    snapshot('188-type-coercion.md')
  )
  expect(await jatsCodec.dump(table)).toMatchFile(
    snapshot('188-type-coercion.jats.xml')
  )
})
