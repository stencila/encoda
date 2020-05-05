import * as schema from '@stencila/schema'
import kitchenSink from '../../__fixtures__/article/kitchen-sink'
import { fixture, snapshot } from '../../__tests__/helpers'
import { PngCodec } from './'

const png = new PngCodec()

describe('decode', () => {
  it('decodes to an ImageObject', async () => {
    const imageObject = (await png.read(
      fixture('test.png')
    )) as schema.ImageObject
    const { type, contentUrl } = imageObject
    expect(type).toBe('ImageObject')
    expect(contentUrl).toBeDefined()
  })
})

describe('encode', () => {
  // Currently these snapshot files are only tested manually, visually

  it('encodes nodes as a screenshot of HTML', async () => {
    await png.write(kitchenSink, snapshot('kitchen-sink.png'))
  })

  it('respects the theme option', async () => {
    await png.write(kitchenSink, snapshot('kitchen-sink-wilmore.png'), {
      theme: 'wilmore',
    })
  })

  it('has a size option', async () => {
    await png.write(kitchenSink, snapshot('kitchen-sink-800x500.png'), {
      size: {
        width: 800,
        height: 500,
      },
    })
  })
})
