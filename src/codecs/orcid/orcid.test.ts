import { toMatchFile } from 'jest-file-snapshot';
import { decode, sniff, encode } from '.'
import * as vfile from '../../util/vfile'
import * as yaml from '../yaml'
import { nockRecord, snapshot } from '../../__tests__/helpers';

jest.setTimeout(30 * 1000)

test('sniff', async () => {
  expect(await sniff('0000-0002-1825-0097')).toBe(true)
  expect(await sniff('ORCID 0000-0002-1825-0097')).toBe(true)
  expect(await sniff('orcid: 0000-0002-1825-0097')).toBe(true)
  expect(await sniff(' ORCID :  0000-0002-1825-0097  ')).toBe(true)
  expect(await sniff('https://orcid.org/0000-0002-1825-0097')).toBe(true)
  expect(await sniff('http://orcid.org/0000-0002-1825-0097')).toBe(true)
  expect(await sniff(' https://orcid.org/0000-0002-1825-0097  ')).toBe(true)

  expect(await sniff('foo')).toBe(false)
  expect(await sniff('https://example.org/0000-0002-1825-0097')).toBe(false)
})

const orcid2yaml = async (ocid: string) =>
  vfile.dump(await yaml.encode(await decode(await vfile.load(ocid))))

test.skip('decode', async () => {
  const done = await nockRecord('decode.json')

  expect(await orcid2yaml('0000-0002-1825-0097')).toMatchFile(snapshot('josiah.yaml'))
  expect(await orcid2yaml('https://orcid.org/0000-0002-9079-593X')).toMatchFile(snapshot('stephen.yaml'))

  done()
})

test('encode', async () => {
  await expect(encode(null)).rejects.toThrow(
    /Encoding to an ORCID is not yet implemented/
  )
})
