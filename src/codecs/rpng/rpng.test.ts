import fs from 'fs-extra'
import { pythonCodeChunk, rCodeExpression, rCodeExpressionNoOutput } from '../../__fixtures__/code/kitchen-sink'
import { asciimathFragment, texBlock } from '../../__fixtures__/math/kitchen-sink'
import { snapshot } from '../../__tests__/helpers'
import { extract, has, insert, RpngCodec } from './'

const rpngCodec = new RpngCodec()

const rpngPath = snapshot('hello-world.png')

beforeAll(async () => {
  await rpngCodec.write(
    { type: 'Paragraph', content: ['Hello world'] },
    rpngPath
  )
})

test('sniff', async () => {
  expect(await rpngCodec.sniff(rpngPath)).toBe(true)
  expect(await rpngCodec.sniff('/some/file.zip')).toBe(false)

  expect(rpngCodec.sniffSync(rpngPath)).toBe(true)
  expect(rpngCodec.sniffSync('/some/file.zip')).toBe(false)
})

test('sniffDecodeSync', async () => {
  expect(await rpngCodec.sniffDecodeSync(rpngPath)).toEqual({
    type: 'Paragraph',
    content: ['Hello world']
  })
})

describe('encode+decode', () => {
  test.each([
    ['asciimath-fragment', asciimathFragment],
    ['tex-block', texBlock],
    ['r-code-expression', rCodeExpression],
    ['r-code-expression-no-output', rCodeExpressionNoOutput],
    ['python-code-chunk', pythonCodeChunk]
  ])('%s', async (name, node) => {
    const file = snapshot(name + '.png')
    await rpngCodec.write(node, file)
    expect(await rpngCodec.read(file)).toEqual(node)
  })
})

test('insert, has, extract', async () => {
  let image = await fs.readFile(rpngPath)
  const keyword = 'MyTextChunkKeyword'
  const content = 'Some content'

  image = insert(keyword, content, image)
  expect(has(keyword, image)).toBe(true)
  expect(extract(keyword, image)).toEqual(content)
})

test('encoding of extended character sets', async () => {
  let image = await fs.readFile(rpngPath)
  const keyword = 'MyExtendedCharChunkKeyword'
  const content = 'An emoji: 🎉'

  image = insert(keyword, content, image)
  expect(has(keyword, image)).toBe(true)
  expect(extract(keyword, image)).toEqual(content)
})
