import schema from '@stencila/schema'
import { XmdCodec } from '../../codecs/xmd'

/**
 * See https://github.com/stencila/encoda/issues/717
 *
 * Tests below check parsing of both Unix and Windows style line endings
 */
test('issue 717: Windows line endings break decoding of code chunks', async () => {
  const xmdCodec = new XmdCodec()

  const chunk1 = schema.article({
    content: [
      schema.codeChunk({
        programmingLanguage: 'r',
        text: 'plot(x,y)',
      }),
    ],
  })

  const chunk2 = schema.article({
    content: [
      schema.codeChunk({
        programmingLanguage: 'r',
        text: 'line1\nline2',
      }),
    ],
  })

  const chunk3 = schema.article({
    content: [
      schema.codeChunk({
        programmingLanguage: 'r',
        text: '# A comment ```',
      }),
    ],
  })

  // RMarkdown style code chunks including those nested within a CodeChunk block extension
  expect(await xmdCodec.load('```{r}\nplot(x,y)\n```\n')).toEqual(chunk1)
  expect(await xmdCodec.load('```{r}\r\nplot(x,y)\r\n```\r\n')).toEqual(chunk1)
  expect(
    await xmdCodec.load('chunk:\n:::\n```{r}\nplot(x,y)\n```\n:::\n')
  ).toEqual(chunk1)
  expect(
    await xmdCodec.load(
      'chunk:\r\n:::\r\n```{r}\r\nplot(x,y)\r\n```\r\n:::\r\n'
    )
  ).toEqual(chunk1)

  // As above but with multiline code
  expect(await xmdCodec.load('```{r}\nline1\nline2\n```\n')).toEqual(chunk2)
  expect(await xmdCodec.load('```{r}\r\nline1\r\nline2\r\n```\r\n')).toEqual(
    chunk2
  )
  expect(
    await xmdCodec.load('chunk:\n:::\n```{r}\nline1\nline2\n```\n:::\n')
  ).toEqual(chunk2)
  expect(
    await xmdCodec.load(
      'chunk:\r\n:::\r\n```{r}\r\nline1\r\nline2\r\n```\r\n:::\r\n'
    )
  ).toEqual(chunk2)

  // As above but with a space after the opening backticks
  expect(await xmdCodec.load('``` {r}\nline1\nline2\n```\n')).toEqual(chunk2)
  expect(await xmdCodec.load('``` {r}\r\nline1\r\nline2\r\n```\r\n')).toEqual(
    chunk2
  )
  expect(
    await xmdCodec.load('chunk:\n:::\n``` {r}\nline1\nline2\n```\n:::\n')
  ).toEqual(chunk2)
  expect(
    await xmdCodec.load(
      'chunk:\r\n:::\r\n``` {r}\r\nline1\r\nline2\r\n```\r\n:::\r\n'
    )
  ).toEqual(chunk2)

  // As above but with a tab and a space after the opening backticks
  expect(await xmdCodec.load('```\t {r}\nline1\nline2\n```\n')).toEqual(chunk2)
  expect(await xmdCodec.load('```\t {r}\r\nline1\r\nline2\r\n```\r\n')).toEqual(
    chunk2
  )
  expect(
    await xmdCodec.load('chunk:\n:::\n```\t {r}\nline1\nline2\n```\n:::\n')
  ).toEqual(chunk2)
  expect(
    await xmdCodec.load(
      'chunk:\r\n:::\r\n```\t {r}\r\nline1\r\nline2\r\n```\r\n:::\r\n'
    )
  ).toEqual(chunk2)

  // As above but with a code chunk containing backticks (but not at the start of the line)
  expect(await xmdCodec.load('```{r}\n# A comment ```\n```\n')).toEqual(chunk3)
  expect(await xmdCodec.load('```{r}\r\n# A comment ```\r\n```\r\n')).toEqual(
    chunk3
  )
  expect(
    await xmdCodec.load('chunk:\n:::\n```{r}\n# A comment ```\n```\n:::\n')
  ).toEqual(chunk3)
  expect(
    await xmdCodec.load('chunk:\r\n:::\r\n```{r}\r\n# A comment ```\r\n:::\r\n')
  ).toEqual(chunk3)
})
