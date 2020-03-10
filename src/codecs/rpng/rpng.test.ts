import fs from 'fs-extra'
import {
  pythonCodeChunk,
  rCodeExpression,
  rCodeExpressionNoOutput
} from '../../__fixtures__/code/kitchen-sink'
import {
  asciimathFragment,
  texBlock
} from '../../__fixtures__/math/kitchen-sink'
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
