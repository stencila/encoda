import { CSLCodec } from '.'
import { fixture, snapshot } from '../../__tests__/helpers'
import { YamlCodec } from '../yaml'

const yamlCodec = new YamlCodec()
const cslCodec = new CSLCodec()

// Skip on Windows CI due to these errors:
// https://dev.azure.com/stencila/stencila/_build/results?buildId=719&view=logs&j=b17395f6-68a3-5682-0476-d3f6f1043109&t=0d6dcb53-0957-53aa-c18a-237166af945a&l=443
if (!(process.env.CI && process.platform === 'win32'))
  test('decode', async () => {
    const csl2yaml = async (name: string) =>
      yamlCodec.dump(await cslCodec.read(fixture(name)))

    expect(await csl2yaml('10.5334-jors-182.csl.json')).toMatchFile(
      snapshot('10.5334-jors-182.yaml')
    )
  })

test('encode', async () => {
  const yaml2csl = async (name: string) =>
    cslCodec.dump(await yamlCodec.read(fixture(name)))

  expect(await yaml2csl('article.yaml')).toMatchFile(
    snapshot('article.csl.json')
  )
})
