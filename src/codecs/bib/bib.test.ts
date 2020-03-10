import { BibCodec } from '.'
import { fixture, snapshot } from '../../__tests__/helpers'
import { YamlCodec } from '../yaml'

const bibCodec = new BibCodec()
const yamlCodec = new YamlCodec()

// Skip on Windows CI due to these errors:
// https://dev.azure.com/stencila/stencila/_build/results?buildId=719&view=logs&j=b17395f6-68a3-5682-0476-d3f6f1043109&t=0d6dcb53-0957-53aa-c18a-237166af945a&l=443
if (!(process.env.CI && process.platform === 'win32'))
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
