import stencila from '@stencila/schema'
import { decode, encode } from '../src/codecs/dmagic'
import { create, dump } from '../src/vfile'

test('decode', async () => {
  await expect(decode(create())).rejects.toThrow(
    /Decoding of Demo Magic scripts is not supported/
  )
})

test('encode', async () => {
  expect(
    await dump(await encode(node, { codecOptions: { embed: false } }))
  ).toEqual(bash)
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
      language: 'bash',
      value: 'date'
    },
    {
      type: 'CodeBlock',
      language: 'bash',
      value: 'date --utc',
      meta: {
        pause: 2
      }
    },
    {
      type: 'CodeBlock',
      language: 'sh',
      value: 'date -u'
    },
    {
      type: 'CodeBlock',
      language: 'foo',
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
