import { BibCodec } from '.'
import { fixture, snapshot } from '../../__tests__/helpers'
import { YamlCodec } from '../yaml'

const bibCodec = new BibCodec()
const yamlCodec = new YamlCodec()

test('decode', async () => {
  const bib2yaml = async (name: string) =>
    yamlCodec.dump(await bibCodec.read(fixture(name)))

  expect(await bib2yaml('small.bib')).toMatchFile(snapshot('small.yaml'))
})

test('encode', async () => {
  const yaml2bib = async (name: string) =>
    bibCodec.dump(await yamlCodec.read(fixture(name)))

  expect(await yaml2bib('article.yaml')).toMatchFile(snapshot('article.bib'))
})
