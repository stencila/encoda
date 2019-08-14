import { toMatchFile } from 'jest-file-snapshot'
import { JsonLdCodec } from '.'
import * as vfile from '../../util/vfile'
import { fixture, snapshot } from '../../__tests__/helpers'
import { YamlCodec } from '../yaml'

const yaml = new YamlCodec()
const jsonld = new JsonLdCodec()

const jsonld2yaml = async (name: string) =>
  vfile.dump(
    await yaml.encode(await jsonld.decode(await vfile.read(fixture(name))))
  )

describe('decode', () => {
  test('orcid', async () =>
    expect(await jsonld2yaml('orcid.jsonld')).toMatchFile(
      snapshot('orcid.yaml')
    ))

  test('datacite', async () =>
    expect(await jsonld2yaml('datacite.jsonld')).toMatchFile(
      snapshot('datacite.yaml')
    ))
})
