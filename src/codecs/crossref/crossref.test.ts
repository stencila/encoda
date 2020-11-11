import { CrossrefCodec } from '.'
import * as vfile from '../../util/vfile'
import { nockRecord, snapshot } from '../../__tests__/helpers'
import { YamlCodec } from '../yaml'
import * as elife50356 from '../../__fixtures__/article/journal/elife/50356.json'

const crossref = new CrossrefCodec()
const yaml = new YamlCodec()

const query2yaml = async (query: string) =>
  vfile.dump(await yaml.encode(await crossref.decode(await vfile.load(query))))

test.skip('decode', async () => {
  const done = await nockRecord('carlsson-and-ekre-2019.json')
  expect(
    await query2yaml('Carlsson and Ekre, Tensor Computations in Julia')
  ).toMatchFile(snapshot('carlsson-and-ekre-2019.yaml'))
  done()
})

test('encode', async () => {
  expect(await crossref.dump(elife50356)).toMatchFile(snapshot('elife50356.xml'))
})
