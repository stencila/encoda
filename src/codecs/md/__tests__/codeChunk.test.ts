import fs from 'fs'
import path from 'path'
import { MdCodec } from '..'
import figureJSON from '../__fixtures__/figureCodeChunk.json'
import tableJSON from '../__fixtures__/tableCodeChunk.json'

const figureMD = fs
  .readFileSync(path.join(__dirname, '../__fixtures__/figureCodeChunk.md'))
  .toString()

const tableMD = fs
  .readFileSync(path.join(__dirname, '../__fixtures__/tableCodeChunk.md'))
  .toString()

const mdCodec = new MdCodec()

describe('CodeChunk', () => {
  test('encode', async () => {
    expect(await mdCodec.dump(figureJSON)).toEqual(figureMD)
    expect(await mdCodec.dump(tableJSON)).toEqual(tableMD)
  })

  test('decode', async () => {
    expect(await mdCodec.load(figureMD)).toEqual(figureJSON)
    expect(await mdCodec.load(tableMD)).toEqual(tableJSON)
  })
})
