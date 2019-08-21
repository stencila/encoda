import { toMatchFile } from 'jest-file-snapshot'
import { JsonLdCodec } from '.'
import * as vfile from '../../util/vfile'
import { fixture, snapshot, nockRecord } from '../../__tests__/helpers'
import { YamlCodec } from '../yaml'

const yaml = new YamlCodec()
const jsonld = new JsonLdCodec()

jest.setTimeout(60 * 1000)

/**
 * Use nock-record to record all HTTP requests during this test suite
 *
 * We have one nock recording, rather than one for each test, because
 * the `jsonld` context involves various caching (in-memory and on-disk).
 * If you need to re-record, then remove `nock-record.json` and the local
 * on disk cache before rerunning these tests e.g.
 *
 * ```bash
 * rm -rf ~/.config/stencila/encoda/cache/
 * rm src/codecs/jsonld/__fixtures__/nock-record.json
 * ```
 */
let nockDone: () => void
beforeAll(async () => {
  nockDone = await nockRecord('nock-record.json')
})
afterAll(async () => {
  nockDone()
})

const jsonld2yaml = async (name: string) =>
  vfile.dump(
    await yaml.encode(await jsonld.decode(await vfile.read(fixture(name))))
  )

const yaml2jsonld = async (name: string) =>
  vfile.dump(
    await jsonld.encode(await yaml.decode(await vfile.read(fixture(name))))
  )

describe('decode', () => {
  test('orcid', async () => {
    expect(await jsonld2yaml('orcid.jsonld')).toMatchFile(
      snapshot('orcid.yaml')
    )
  })

  test('datacite', async () => {
    expect(await jsonld2yaml('datacite.jsonld')).toMatchFile(
      snapshot('datacite.yaml')
    )
  })

  test('image', async () => {
    expect(await jsonld2yaml('image.jsonld')).toMatchFile(
      snapshot('image.yaml')
    )
  })
})

describe('encode', () => {
  test('article', async () => {
    expect(await yaml2jsonld('article.yaml')).toMatchFile(
      snapshot('article.jsonld')
    )
  })
})
