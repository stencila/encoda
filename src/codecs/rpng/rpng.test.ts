import fs from 'fs-extra'
import { pythonCodeChunk, rCodeExpression, rCodeExpressionNoOutput } from '../../__fixtures__/code/kitchen-sink'
import { asciimathFragment, texBlock } from '../../__fixtures__/math/kitchen-sink'
import { snapshot } from '../../__tests__/helpers'
import { PngCodec } from '../png'
import { extract, has, insert, RpngCodec } from './'

const pngCodec = new PngCodec()
const rpngCodec = new RpngCodec()

const testNode = { type: 'Paragraph', content: ['Hello world'] }
const rpngPath = snapshot('hello-world.png')
const pngPath = snapshot('hello-world-plain.png')

beforeAll(async () => {
  await rpngCodec.write(testNode, rpngPath)
  await pngCodec.write(testNode, pngPath)
})

test('sniff', async () => {
  expect(await rpngCodec.sniff(rpngPath)).toBe(true)
  expect(await rpngCodec.sniff(pngPath)).toBe(false)
  expect(await rpngCodec.sniff('/some/file.zip')).toBe(false)
})

test('sniffDecode', async () => {
  expect(await rpngCodec.sniffDecode(rpngPath)).toEqual(testNode)
  expect(await rpngCodec.sniffDecode(pngPath)).toEqual(undefined)
  expect(await rpngCodec.sniffDecode('/some/file.zip')).toEqual(undefined)
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

describe('encoding of extended character sets', () => {
  const keyword = 'MyChunkKeyword'
  const content = 'An emoji: 🎉'

  test.each(['tEXt', 'zTXt'])('%s', async type => {
    let image = await fs.readFile(rpngPath)
    image = insert(keyword, content, image, type as 'tEXt' | 'zTXt')
    expect(has(keyword, image)).toBe(true)
    expect(extract(keyword, image)).toEqual(content)
  })
})
