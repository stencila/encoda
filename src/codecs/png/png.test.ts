import { schema } from '@stencila/jesta'
import kitchenSink from '../../__fixtures__/article/kitchen-sink'
import {
  pythonCodeChunk,
  rCodeChunkImageOutput,
  rCodeChunkNoOutput,
  rCodeChunkError,
  rCodeExpression,
  rCodeExpressionNoOutput,
  rCodeExpressionError,
} from '../../__fixtures__/code/kitchen-sink'
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
  // Currently these snapshot files are only "tested"
  // by visual inspection

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

  it('encodes a code chunk', async () => {
    const opts = {
      theme: 'rpng',
      selector: 'stencila-code-chunk',
    }

    await png.write(pythonCodeChunk, snapshot('python-code-chunk.png'), opts)
    await png.write(
      rCodeChunkImageOutput,
      snapshot('r-code-chunk-image-output.png'),
      opts
    )
    await png.write(
      rCodeChunkNoOutput,
      snapshot('r-code-chunk-no-output.png'),
      opts
    )
    await png.write(rCodeChunkError, snapshot('r-code-chunk-error.png'), opts)
  })

  it('encodes a code expression', async () => {
    const opts = {
      theme: 'rpng',
      selector: 'stencila-code-expression',
    }

    await png.write(rCodeExpression, snapshot('r-code-expr.png'), opts)
    await png.write(
      rCodeExpressionNoOutput,
      snapshot('r-code-expr-no-output.png'),
      opts
    )
    await png.write(
      rCodeExpressionError,
      snapshot('r-code-expr-error.png'),
      opts
    )
  })
})
