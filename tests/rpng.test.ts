import fs from 'fs'
import path from 'path'
import {
  extract,
  has,
  insert,
  parse,
  parseSync,
  sniff,
  sniffSync,
  unparse
} from '../src/rpng'
import { read } from '../src/vfile'
import vfile = require('vfile')

// TODO add additional test files

// This PNG was generated from one of the other fixtures using:
//   npx ts-node --files src/cli.ts tests/fixtures/paragraph/simple/simple.json --to rpng tests/fixtures/rpng/rpng.png
const rpngPath = path.join(__dirname, 'fixtures', 'rpng', 'rpng.png')
// ... and this is the node for that fixture:
const node = {
  type: 'Article',
  content: [
    {
      type: 'Paragraph',
      content: ['The first paragraph.']
    },
    {
      type: 'Paragraph',
      content: [
        'The second paragraph which is longer. Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'
      ]
    }
  ]
}

test('sniff', async () => {
  expect(await sniff(rpngPath)).toBe(true)
  expect(await sniff('/some/file.zip')).toBe(false)

  expect(sniffSync(rpngPath)).toBe(true)
  expect(sniffSync('/some/file.zip')).toBe(false)
})

test('parse', async () => {
  const file = await read(rpngPath)
  expect(await parse(file)).toEqual(node)
  expect(parseSync(file)).toEqual(node)
})

test('unparse', async () => {
  const file = await unparse(node)
  expect(file).toBeInstanceOf(vfile)
  expect(await parse(file)).toEqual(node)
})

test('insert, has, extract', () => {
  let image = fs.readFileSync(
    path.join(__dirname, 'fixtures', 'rpng', 'rpng.png')
  )
  const keyword = 'MyTextChunkKeyword'
  const content = 'Some content'

  image = insert(keyword, content, image)
  expect(has(keyword, image)).toBe(true)
  expect(extract(keyword, image)).toEqual(content)
})
