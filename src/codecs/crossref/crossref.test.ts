import { setupRecorder } from 'nock-record'
import { toMatchFile } from 'jest-file-snapshot';
import path from 'path'
import { decode, encode } from '.'
import * as vfile from '../../util/vfile'
import * as yaml from '../yaml'

const snapshot = (name: string) =>
  path.join(__dirname, '__file_snapshots__', name)

const record = setupRecorder({ mode: 'record' })

test('decode', async () => {
  const { completeRecording } = await record('crossref-decode')

  const query2yaml = async (query: string) =>
    vfile.dump(await yaml.encode(await decode(await vfile.load(query))))

  expect(await query2yaml('Carlsson and Ekre, Tensor Computations in Julia'))
    .toMatchFile(snapshot('carlsson-and-ekre-2019.yaml'))

  completeRecording()
})

test('encode', async () => {
  await expect(encode(null)).rejects.toThrow(
    /Encoding to a Crossref query is not supported/
  )
})
