import { DoiCodec } from '.'
import { nockRecord, snapshot } from '../../__tests__/helpers'
import { YamlCodec } from '../yaml'

const doiCodec = new DoiCodec()
const yamlCodec = new YamlCodec()

test('sniff', async () => {
  const { sniff } = doiCodec

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
  const doi2yaml = async (doi: string) =>
    yamlCodec.dump(await doiCodec.load(doi))

  const done = await nockRecord('nock-record-decode.json')
  expect(await doi2yaml('10.5334/jors.182')).toMatchFile(
    snapshot('10.5334-jors-182.yaml')
  )
  done()
})

test('encode', async () => {
  expect(() => doiCodec.encode()).toThrow(
    /Encoding to DOI is not yet implemented/
  )
})
