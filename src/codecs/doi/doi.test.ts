import { setupRecorder } from 'nock-record'
import { toMatchFile } from 'jest-file-snapshot';
import path from 'path'
import { sniff, encode } from '.'
import * as vfile from '../../util/vfile'
import { convert } from '../..';

const snapshot = (name: string) =>
  path.join(__dirname, '__file_snapshots__', name)

const record = setupRecorder({ mode: 'record' })

test('sniff', async () => {
  expect(await sniff('10.1001/this/is/a/doi')).toBe(true)
  expect(await sniff('doi 10.1001/ok')).toBe(true)
  expect(await sniff('DOI 10.1001/ok')).toBe(true)
  expect(await sniff('DOI: 10.1001/ok')).toBe(true)
  expect(await sniff('  DOI :  10.1001/ok   ')).toBe(true)
  expect(await sniff('http://doi.org/10.5334/jors.182')).toBe(true)
  expect(await sniff('  https://doi.org/10.5334/jors.182  ')).toBe(true)

  // The `foo` in these example makes them not DOIs
  expect(await sniff('foo')).toBe(false)
  expect(await sniff('doi: foo')).toBe(false)
  expect(await sniff('doi: 10.1001/this/is/a/doi foo')).toBe(false)
  expect(await sniff('http://foo.org/10.5334/jors.182')).toBe(false)
})

test('decode', async () => {
  const { completeRecording } = await record('doi-decode')

  const doi2yaml = async (doi: string) =>
    convert(doi, undefined, { from: 'doi', to: 'yaml' })

  expect(await doi2yaml('10.5334/jors.182')).toMatchFile(snapshot('10.5334-jors.182.yaml'))

  completeRecording()
})

test('encode', async () => {
  await expect(encode({type: 'Article'})).rejects.toThrow(
    /Unparsing to DOI is not yet implemented/
  )
})
