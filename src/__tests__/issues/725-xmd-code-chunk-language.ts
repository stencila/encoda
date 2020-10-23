import schema from '@stencila/schema'
import path from 'path'

import { XmdCodec } from '../../codecs/xmd'
import { MdCodec } from '../../codecs/md'
import { TxtCodec } from '../../codecs/txt'
import { match } from '../..'

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
          text: '# Python code here\n',
        }),
      ],
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
            fig2: '',
          },
          programmingLanguage: '{python',
          text: '\n# Python code here\n',
        }),
      ],
    })
  )
})

/**
 * See https://github.com/stencila/encoda/pull/726#issuecomment-714786201
 *
 * Tests whether there is an issue matching .rmd files to the XmdCodec.
 */
test('issue 725: match function does not resolve .rmd extension to XmdCodec?', async () => {
  const rmd = path.join(__dirname, '725-xmd-code-chunk-language.rmd')

  expect(await match(rmd)).toBeInstanceOf(XmdCodec)

  const xmdCodec = new XmdCodec()
  expect(await xmdCodec.read(rmd)).toEqual(
    schema.article({
      title: 'Test',
      content: [
        schema.codeChunk({
          label: 'fig1',
          programmingLanguage: 'r',
          text: 'plot(1:100)',
        }),
      ],
    })
  )

  // Currently, if the 'content' argument does not exist then it is
  // assumed to be raw context and the `txt` codec is returned.
  // So in these cases the `format` arg needs to be supplied
  expect(await match('doesnt-exist.rmd')).toBeInstanceOf(TxtCodec)
  expect(await match('doesnt-exist.rmd', 'rmd')).toBeInstanceOf(XmdCodec)
  expect(await match('doesnt-exist.rmd', 'xmd')).toBeInstanceOf(XmdCodec)
})
