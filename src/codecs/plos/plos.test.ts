import { PlosCodec } from '.'
import * as vfile from '../../util/vfile'
import unlink from '../../util/unlink'
import { nockRecord, snapshot } from '../../__tests__/helpers'
import { YamlCodec } from '../yaml'

const { decode, decodeIdentifier, sniff, encode } = new PlosCodec()
const yaml = new YamlCodec()

const plos2yaml = async (article: string) => {
  // Fetch, with recording the complete article
  const done = await nockRecord(`nock-record-${article.replace('.', '-')}.json`)
  const node = await decode(await vfile.load(`10.1371/journal.${article}`))
  done()
  // Unlink to remove references to local files (which are non-deterministric)
  const unlinked = unlink(node)
  // Convert to YAML
  return await vfile.dump(await yaml.encode(unlinked))
}

jest.setTimeout(5 * 60 * 1000)

test('sniff', async () => {
  expect(await sniff('10.1371/journal.pone.0216012')).toBe(true)
  expect(await sniff('doi: 10.1371/journal.pone.0216012')).toBe(true)
  expect(await sniff('https://doi.org/10.1371/journal.pone.0216012')).toBe(true)

  expect(
    await sniff(
      'https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0216012'
    )
  ).toBe(true)
  expect(
    await sniff(
      'https://journals.plos.org/plosmedicine/article?id=10.1371/journal.pmed.1002858'
    )
  ).toBe(true)
  expect(
    await sniff(
      ' https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1007273  '
    )
  ).toBe(true)

  expect(await sniff('10.0001/journal.foo.1002858')).toBe(false)
})

test('decodeIdentifier', async () => {
  expect(await decodeIdentifier('10.1371/journal.pbio.3000349')).toEqual({
    journal: 'plosbiology',
    doi: '10.1371/journal.pbio.3000349'
  })
  expect(await decodeIdentifier('10.1371/journal.pcbi.1007273')).toEqual({
    journal: 'ploscompbiol',
    doi: '10.1371/journal.pcbi.1007273'
  })
  expect(await decodeIdentifier('10.1371/journal.pgen.1008133')).toEqual({
    journal: 'plosgenetics',
    doi: '10.1371/journal.pgen.1008133'
  })
  expect(await decodeIdentifier('10.1371/journal.pmed.1002858')).toEqual({
    journal: 'plosmedicine',
    doi: '10.1371/journal.pmed.1002858'
  })
  expect(await decodeIdentifier('10.1371/journal.pntd.0007469')).toEqual({
    journal: 'plosntds',
    doi: '10.1371/journal.pntd.0007469'
  })
  expect(await decodeIdentifier('10.1371/journal.pone.0216012')).toEqual({
    journal: 'plosone',
    doi: '10.1371/journal.pone.0216012'
  })
  expect(await decodeIdentifier('10.1371/journal.ppat.1007958')).toEqual({
    journal: 'plospathogens',
    doi: '10.1371/journal.ppat.1007958'
  })
})

test('decode', async () => {
  expect(await plos2yaml('pbio.3000349')).toMatchFile(
    snapshot('pbio-3000349.yaml')
  )
  expect(await plos2yaml('pcbi.1007273')).toMatchFile(
    snapshot('pcbi-1007273.yaml')
  )
  expect(await plos2yaml('pgen.1008133')).toMatchFile(
    snapshot('pgen-1008133.yaml')
  )
  expect(await plos2yaml('pmed.1002858')).toMatchFile(
    snapshot('pmed-1002858.yaml')
  )
  expect(await plos2yaml('pntd.0007469')).toMatchFile(
    snapshot('pntd-0007469.yaml')
  )
  expect(await plos2yaml('pone.0216012')).toMatchFile(
    snapshot('pone-0216012.yaml')
  )
  expect(await plos2yaml('ppat.1007958')).toMatchFile(
    snapshot('ppat-1007958.yaml')
  )
})

test('encode', async () => {
  await expect(encode()).rejects.toThrow(
    /Encoding to a PLoS article is not yet implemented/
  )
})
