import schema from '@stencila/schema'
import path from 'path'
import { GDocCodec } from '../../codecs/gdoc'
import { MdCodec } from '../../codecs/md'

const gdocCodec = new GDocCodec()
const mdCodec = new MdCodec()

test('issue 58: decoding GDoc incorrectly generates ordered list instead of unordered', async () => {
  const file = path.join(__dirname, '58-list-unordered.gdoc')

  const article = (await gdocCodec.read(file)) as schema.Article
  expect(article.content?.length).toBe(4)

  const list = article.content?.[3] as schema.List
  expect(schema.isA('List', list)).toBe(true)
  expect(list.order).toBe('Unordered')

  const md = await mdCodec.dump(article)
  expect(md).toBe(`---
title: real converter test
---

# This is a file created in the HUB

A para inserted by Nokome

## It will upload to GOOGLE DOCS

-   test
-   test
-   and final test
`)
})
