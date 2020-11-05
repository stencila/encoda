import schema from '@stencila/schema'

import { PlotlyCodec } from '.'

test('decode', async () => {
  const plotlyCodec = new PlotlyCodec()

  async function plotlyLoad(data: any) {
    return plotlyCodec.load(JSON.stringify(data)) as Promise<schema.ImageObject>
  }

  const image = await plotlyLoad([
    {
      type: 'scatter3d',
      x: [1, 2, 3],
      y: [1, 2, 3],
      z: [2, 1, 2],
    },
  ])
  expect(schema.isA('ImageObject', image)).toBe(true)
})
