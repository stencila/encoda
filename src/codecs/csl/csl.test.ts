import { CSLCodec } from '.'
import { fixture, snapshot } from '../../__tests__/helpers'
import { YamlCodec } from '../yaml'

const yamlCodec = new YamlCodec()
const cslCodec = new CSLCodec()

test('decode', async () => {
  const csl2yaml = async (name: string) =>
    yamlCodec.dump(await cslCodec.read(fixture(name)))

  expect(await csl2yaml('10.5334-jors-182.csl.json')).toMatchFile(
    snapshot('10.5334-jors-182.yaml'),
  )
})

test('encode', async () => {
  const yaml2csl = async (name: string) =>
    cslCodec.dump(await yamlCodec.read(fixture(name)))

  expect(await yaml2csl('article.yaml')).toMatchFile(
    snapshot('article.csl.json'),
  )
})
