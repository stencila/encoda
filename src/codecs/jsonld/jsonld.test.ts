import { toMatchFile } from 'jest-file-snapshot';
import { snapshot, fixture } from '../../__tests__/helpers';
import * as jsonld from '.'
import * as yaml from '../yaml'
import * as vfile from '../../util/vfile'

const jsonld2yaml = async (name: string) =>
  vfile.dump(await yaml.encode(await jsonld.decode(await vfile.read(fixture(name)))))

test('decode', async () => {
  expect(await jsonld2yaml('orcid.jsonld')).toMatchFile(snapshot('orcid.yaml'))
  expect(await jsonld2yaml('datacite.jsonld')).toMatchFile(snapshot('datacite.yaml'))
})
