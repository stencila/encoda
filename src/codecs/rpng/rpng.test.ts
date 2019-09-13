import fs from 'fs'
import path from 'path'
import { read } from '../../util/vfile'
import { extract, has, insert, RPNGCodec } from './'
import vfile = require('vfile')

const { decode, decodeSync, encode, sniff, sniffSync } = new RPNGCodec()

// TODO add additional test files

// This PNG was generated from one of the other fixtures using:
//   npx ts-node --files src/cli.ts tests/fixtures/paragraph/simple/simple.json --to rpng tests/fixtures/rpng/rpng.png
const rpngPath = path.join(__dirname, '__fixtures__', 'rpng.png')
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

test('decode', async () => {
  const file = await read(rpngPath)
  expect(await decode(file)).toEqual(node)
})

test('encode', async () => {
  jest.setTimeout(30 * 1000) // Extending timeout due to failing test on AppVeyor
  const file = await encode(node)
  expect(file).toBeInstanceOf(vfile)
  expect(await decode(file)).toEqual(node)
})

test('insert, has, extract', () => {
  let image = fs.readFileSync(rpngPath)
  const keyword = 'MyTextChunkKeyword'
  const content = 'Some content'

  image = insert(keyword, content, image)
  expect(has(keyword, image)).toBe(true)
  expect(extract(keyword, image)).toEqual(content)
})

test('encoding of extended character sets', () => {
  let image = fs.readFileSync(rpngPath)
  const keyword = 'MyExtendedCharChunkKeyword'
  const content = 'An emoji: 🎉'

  image = insert(keyword, content, image)
  expect(has(keyword, image)).toBe(true)
  expect(extract(keyword, image)).toEqual(content)
})
