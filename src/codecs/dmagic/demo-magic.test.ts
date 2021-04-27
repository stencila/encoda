import stencila from '@stencila/schema'
import { commonEncodeDefaults } from '../types'
import { DMagicCodec } from './'

const dMagicCodec = new DMagicCodec()

test('decode', async () => {
  expect(() => dMagicCodec.decode()).toThrow(
    /Decoding of Demo Magic scripts is not supported/
  )
})

test('encode', async () => {
  expect(
    await dMagicCodec.dump(node, {
      ...commonEncodeDefaults,
      isBundle: false,
      isStandalone: false,
    })
  ).toEqual(bash)
})

const node: stencila.Article = {
  type: 'Article',
  title: 'Untitled',
  authors: [],
  content: [
    {
      type: 'Heading',
      depth: 1,
      content: ['Heading one'],
    },
    {
      type: 'Heading',
      depth: 2,
      content: ['Heading two'],
    },
    {
      type: 'Paragraph',
      content: [
        'A paragraph with ',
        {
          type: 'Strong',
          content: ['strong'],
        },
        ' and ',
        {
          type: 'CodeFragment',
          text: 'code',
        },
      ],
    },
    {
      type: 'CodeBlock',
      programmingLanguage: 'bash',
      text: 'date',
    },
    {
      type: 'CodeBlock',
      programmingLanguage: 'bash',
      text: 'date --utc',
      meta: {
        pause: 2,
      },
    },
    {
      type: 'CodeBlock',
      programmingLanguage: 'sh',
      text: 'date -u',
    },
    {
      type: 'CodeBlock',
      programmingLanguage: 'foo',
      text: 'ignored',
    },
  ],
}

const bash = `#!/usr/bin/env bash
. demo-magic.sh
clear

h "Heading one"

h "Heading two"

pa "A paragraph with strong and code"

pe "date"

pe "date --utc"
z 2

pe "date -u"

`
