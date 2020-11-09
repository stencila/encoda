import * as schema from '@stencila/schema'
import { plotlyMediaType } from '../../codecs/plotly'

export const plotlyImage = schema.imageObject({
  contentUrl: 'https://via.placeholder.com/300x150',
  content: [
    {
      mediaType: plotlyMediaType,
      data: {
        type: 'scatter',
        x: [1, 2, 3],
        y: [1, 2, 3],
      },
    },
  ],
})
