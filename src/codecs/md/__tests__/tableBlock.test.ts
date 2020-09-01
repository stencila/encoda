import fs from 'fs'
import path from 'path'
import { MdCodec } from '..'
import tableJSON from '../__fixtures__/tableBlock.json'

const tableMD = fs
  .readFileSync(path.join(__dirname, '../__fixtures__/tableBlock.md'))
  .toString()

const mdCodec = new MdCodec()

describe('Table Block Extension', () => {
  test('encode', async () => {
    expect(await mdCodec.dump(tableJSON)).toEqual(tableMD)
  })

  test('decode', async () => {
    expect(await mdCodec.load(tableMD)).toEqual(tableJSON)
  })
})
