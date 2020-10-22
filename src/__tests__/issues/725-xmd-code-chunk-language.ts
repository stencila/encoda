import schema from '@stencila/schema'
import { XmdCodec } from '../../codecs/xmd'
import { MdCodec } from '../../codecs/md'

/**
 * See https://github.com/stencila/encoda/issues/725
 *
 * Tests parsing of the provided XMarkdown using the XmdCodec
 * and the MdCodec. These are expected to produce different nodes.
 *
 * There are differences in treatment of leading and trailing whitespace
 * around the code itself. This will be dealt with in another fix.
 */
test('issue 725: programming language is incorrectly decoded', async () => {
  const xmd1a = '# Test\n\n```{python fig2}\n\n# Python code here\n\n```\n'

  // As expected the XMarkdown codec parses this as a CodeChunk.
  // Note that the chunk programming language and label are correctly
  // decoded.
  const xmdCodec = new XmdCodec()
  expect(await xmdCodec.load(xmd1a)).toEqual(
    schema.article({
      title: 'Test',
      content: [
        schema.codeChunk({
          label: 'fig2',
          programmingLanguage: 'python',
          text: '# Python code here\n'
        })
      ]
    })
  )

  // As expected the Markdown codec parses this as a CodeBlock.
  // Note the leading brace as reported in the issue.
  const mdCodec = new MdCodec()
  expect(await mdCodec.load(xmd1a)).toEqual(
    schema.article({
      title: 'Test',
      content: [
        schema.codeBlock({
          meta: {
            fig2: ''
          },
          programmingLanguage: '{python',
          text: '\n# Python code here\n'
        })
      ]
    })
  )
})
