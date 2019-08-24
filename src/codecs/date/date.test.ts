import * as stencila from '@stencila/schema'
import * as vfile from '../../util/vfile'
import { DateCodec } from '.'

const date = new DateCodec()
const decode = async (text: string) => date.decode(await vfile.load(text))
const encode = async (node: stencila.Node) => vfile.dump(await date.encode(node))

const ny1990 = stencila.date('1990-01-01T00:00:00.000Z')
const waitangi = stencila.date('1840-02-05T12:20:56.000Z')

test('decode', async () => {
  for (const date of ['1990', '1990-01', '1990-01-01']) {
    expect(await decode(date)).toEqual(ny1990)
  }
  expect(await decode('2 Jun 2004 14:31')).toEqual(stencila.date('2004-06-02T14:31:00.000Z'))
})

test('encode', async () => {
  expect(await encode(ny1990)).toEqual('1990-01-01')
  expect(await encode(waitangi)).toEqual('1840-02-05T12:20:56.000Z')
})
