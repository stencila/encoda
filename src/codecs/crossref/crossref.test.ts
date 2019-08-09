import { toMatchFile } from 'jest-file-snapshot'
import { decode, encode } from '.'
import { snapshot, nockRecord } from '../../__tests__/helpers'
import * as vfile from '../../util/vfile'
import * as yaml from '../yaml'

const query2yaml = async (query: string) =>
  vfile.dump(await yaml.encode(await decode(await vfile.load(query))))

jest.setTimeout(30 * 1000)

test('decode', async () => {
  const done = await nockRecord('carlsson-and-ekre-2019.json')
  expect(
    await query2yaml('Carlsson and Ekre, Tensor Computations in Julia')
  ).toMatchFile(snapshot('carlsson-and-ekre-2019.yaml'))
  done()
})

test('encode', async () => {
  await expect(encode(null)).rejects.toThrow(
    /Encoding to a Crossref query is not supported/
  )
})
