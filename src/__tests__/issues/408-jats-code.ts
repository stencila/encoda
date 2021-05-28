import { schema } from '@stencila/jesta'
import { JatsCodec } from '../../codecs/jats'

/**
 * See https://github.com/stencila/encoda/issues/408
 *
 * The issue was that, although we have decoding of `<code>` elements, a `CodeBlock`
 * was getting generated and because that is block content within a `Paragraph`
 * it got 'inlined' (i.e just it's string contents taken). That bug was addressed (for
 * `MathBlock`) with 7da0ef9f181c0ff1dbdfefb76d0dadf0da384bb9. This is a
 * regression test.
 */
test('issue 408: decoding / encoding of <code> within <p> elements in JATS', async () => {
  const jats = new JatsCodec()

  expect(
    await jats.load(
      '<p>A paragraph with some <code>fancy computer code</code> in it.</p>'
    )
  ).toEqual([
    schema.paragraph({ content: ['A paragraph with some '] }),
    schema.codeBlock({ text: 'fancy computer code' }),
    schema.paragraph({ content: [' in it.'] }),
  ])
})
