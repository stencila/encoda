import * as schema from '@stencila/schema'
import { plotlyMediaType } from '../../codecs/plotly'
import { tinyImageUrl } from './tiny'

export const plotlyImage = schema.imageObject({
  contentUrl: tinyImageUrl,
  content: [
    {
      mediaType: plotlyMediaType,
      data: [
        {
          type: 'scatter',
          x: [1, 2, 3],
          y: [1, 2, 3],
        },
      ],
    },
  ],
})
