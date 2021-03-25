import schema from '@stencila/schema'
import { VegaCodec, vegaMediaType } from '.'
import { testData, vegaImage } from '../../__fixtures__/image/vega'

const vegaCodec = new VegaCodec()

describe('decode', () => {
  async function vegaLoad(data: any) {
    return vegaCodec.load(JSON.stringify(data)) as Promise<schema.ImageObject>
  }

  test('basic', async () => {
    const image = await vegaLoad(testData)
    expect(schema.isA('ImageObject', image)).toBe(true)
    expect(image.contentUrl).toMatch(/^data:image\/png;base64,/)
    expect(image.content).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ mediaType: vegaMediaType, spec: testData }),
      ])
    )
  })
})

describe('encode', () => {
  async function vegaDump(image: schema.ImageObject): Promise<any> {
    return JSON.parse(await vegaCodec.dump(image))
  }

  test('basic', async () => {
    const data = await vegaDump(vegaImage)
    expect(data).toEqual(testData)
  })

  test('not vega', async () => {
    const image = schema.imageObject({
      contentUrl: 'data:image/png;base64,phony',
    })
    const data = await vegaDump(image)
    expect(data).toEqual({})
  })
})
