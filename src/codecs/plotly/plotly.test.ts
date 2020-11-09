import schema from '@stencila/schema'

import { PlotlyCodec, plotlyMediaType } from '.'
import { plotlyImage } from '../../__fixtures__/image/plotly'

const plotlyCodec = new PlotlyCodec()

describe('decode', () => {
  async function plotlyLoad(data: any) {
    return plotlyCodec.load(JSON.stringify(data)) as Promise<schema.ImageObject>
  }

  test('basic', async () => {
    const data = [
      {
        type: 'scatter',
        x: [1, 2, 3],
        y: [1, 2, 3],
      },
    ]
    const image = await plotlyLoad(data)
    expect(schema.isA('ImageObject', image)).toBe(true)
    expect(image.contentUrl).toMatch(/^data:image\/png;base64,/)
    expect(image.content).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ mediaType: plotlyMediaType, data }),
      ])
    )
  })
})

describe('encode', () => {
  async function plotlyDump(image: schema.ImageObject): Promise<any> {
    return JSON.parse(await plotlyCodec.dump(image))
  }

  test('basic', async () => {
    const data = await plotlyDump(plotlyImage)
    expect(data).toEqual({
      type: 'scatter',
      x: [1, 2, 3],
      y: [1, 2, 3],
    })
  })

  test('not plotly', async () => {
    const image = schema.imageObject({
      contentUrl: 'data:image/png;base64,phony',
    })
    const data = await plotlyDump(image)
    expect(data).toEqual({})
  })
})
