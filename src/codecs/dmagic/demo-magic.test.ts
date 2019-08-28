import stencila from '@stencila/schema'
import { DMagicCodec } from './'
import { create, dump } from '../../util/vfile'

const { decode, encode } = new DMagicCodec()

test('decode', async () => {
  // @ts-ignore
  await expect(decode(create())).rejects.toThrow(
    /Decoding of Demo Magic scripts is not supported/
  )
})

test('encode', async () => {
  expect(await dump(await encode(node, { isBundle: false }))).toEqual(bash)
  expect(await encode(node)).toBeTruthy()
})

const node: stencila.Article = {
  type: 'Article',
  title: 'Untitled',
  authors: [],
  content: [
    {
      type: 'Heading',
      depth: 1,
      content: ['Heading one']
    },
    {
      type: 'Heading',
      depth: 2,
      content: ['Heading two']
    },
    {
      type: 'Paragraph',
      content: [
        'A paragraph with ',
        {
          type: 'Strong',
          content: ['strong']
        },
        ' and ',
        {
          type: 'Code',
          value: 'code'
        }
      ]
    },
    {
      type: 'CodeBlock',
      programmingLanguage: 'bash',
      value: 'date'
    },
    {
      type: 'CodeBlock',
      programmingLanguage: 'bash',
      value: 'date --utc',
      meta: {
        pause: 2
      }
    },
    {
      type: 'CodeBlock',
      programmingLanguage: 'sh',
      value: 'date -u'
    },
    {
      type: 'CodeBlock',
      programmingLanguage: 'foo',
      value: 'ignored'
    }
  ]
}

const bash = `h 1 "# Heading one"

h 2 "## Heading two"

p "# A paragraph with **strong** and \\\`code\\\`"

pe "date"

pe "date --utc"
z 2

pe "date -u"

`
