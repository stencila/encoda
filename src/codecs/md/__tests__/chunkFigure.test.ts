import schema from '@stencila/schema'
import fs from 'fs'
import path from 'path'
import { MdCodec } from '../'
import { dump, load } from '../../../util/vfile'
import codeJSON from '../__fixtures__/codeChunkFigure.json'
import tableJSON from '../__fixtures__/tableChunkFigure.json'

const codeMD = fs
  .readFileSync(path.join(__dirname, '../__fixtures__/codeChunkFigure.md'))
  .toString()

const tableMD = fs
  .readFileSync(path.join(__dirname, '../__fixtures__/tableChunkFigure.md'))
  .toString()

const mdCodec = new MdCodec()
const { decode, encode } = mdCodec

const e = async (node: schema.Node) => await dump(await encode(node))
const d = async (md: string) => await decode(load(md))

describe('ChunkFigure - CodeChunk', () => {
  test('encode', async () => {
    expect(await e(codeJSON)).toEqual(codeMD)
  })

  test('decode', async () => {
    expect(await d(codeMD)).toEqual(codeJSON)
  })
})

describe('ChunkFigure - Table', () => {
  test('encode', async () => {
    expect(await e(tableJSON)).toEqual(tableMD)
  })

  test('decode', async () => {
    expect(await d(tableMD)).toEqual(tableJSON)
  })
})
