import * as stencila from '@stencila/schema'
import * as vfile from '../../util/vfile'
import { CsiCodec } from '.'

const csi = new CsiCodec()
const decode = async (text: string) => csi.decode(await vfile.load(text))
const encode = async (node: stencila.Node) => vfile.dump(await csi.encode(node))


test('decode', async () => {
  expect(await decode('a')).toEqual(['a'])
  expect(await decode('a, b, c')).toEqual(['a', 'b', 'c'])
  expect(await decode('a,b  ,  c, de')).toEqual(['a', 'b', 'c', 'de'])
})

test('encode', async () => {
  expect(await encode(['a'])).toEqual('a')
  expect(await encode('a')).toEqual('a')
  expect(await encode(['a', 'b', 'c'])).toEqual('a, b, c')
  expect(await encode([1, 2, 3])).toEqual('1, 2, 3')
  expect(await encode([1, {}, null])).toEqual('1, [object Object], null')
})
