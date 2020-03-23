import { JsonLdCodec } from '.'
import { fixture, snapshot, nockRecord } from '../../__tests__/helpers'
import { YamlCodec } from '../yaml'
import { unlinkFiles } from '../../util/media/unlinkFiles'

const yaml = new YamlCodec()
const jsonld = new JsonLdCodec()

const jsonld2yaml = async (name: string) =>
  yaml.dump(await unlinkFiles(await jsonld.read(fixture(name))))

const yaml2jsonld = async (name: string) =>
  jsonld.dump(await yaml.read(fixture(name)))

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
