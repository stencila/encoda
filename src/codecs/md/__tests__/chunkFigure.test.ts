import schema from '@stencila/schema'
import fs from 'fs'
import path from 'path'
import { MdCodec } from '../'
import { dump, load } from '../../../util/vfile'
import chunkFigureJSON from '../__fixtures__/chunkFigure.json'

const mdCodec = new MdCodec()
const { decode, encode } = mdCodec

const e = async (node: schema.Node) => await dump(await encode(node))
const d = async (md: string) => await decode(load(md))

const chunkFigureMD = fs
  .readFileSync(path.join(__dirname, '../__fixtures__/chunkFigure.md'))
  .toString()

describe('ChunkFigure', () => {
  test('encode', async () => {
    expect(await e(chunkFigureJSON)).toEqual(chunkFigureMD)
  })

  test('decode', async () => {
    expect(await d(chunkFigureMD)).toEqual(chunkFigureJSON)
  })
})
