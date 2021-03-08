// Remark plugin for Citation nodes
// Based on https://github.com/zestedesavoir/zmarkdown/blob/master/packages/remark-sub-super/src/index.js
// Encode Pandoc style `@`-prefixed citation e.g. `@smith04` strings into a custom `Cite` MDAST node type.

import { array as A, option as O } from 'fp-ts'
import { pipe } from 'fp-ts/lib/pipeable'
import { Eat, Locator, Parser, Tokenizer } from 'remark-parse'
import { Plugin } from 'unified'

const marker = '@'
const CITE_REGEX = /[ [(]@([\w|-]+)[\w.]*[\])]?|^@([\w|-]+)[\w.]*/

const locator: Locator = (value, fromIndex) => {
  let index = -1
  const found = []
  index = value.indexOf(marker, fromIndex)
  if (index !== -1) {
    found.push(index)
  }

  if (!A.isEmpty(found)) {
    found.sort((a, b) => a - b)
    return found[0]
  }

  return -1
}

export const citePlugin: Plugin<[]> = function () {
  const inlineTokenizer: Tokenizer = function (
    this: Parser,
    eat: Eat,
    value: string
  ) {
    // allow escaping of all markers
    // @ts-expect-error
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (!this.escape.includes(marker)) this.escape.push(marker)

    const startChar = value[0]
    // @ts-expect-error
    const now = eat.now()
    now.column += 1
    now.offset += 1

    if (
      startChar === marker &&
      !value.startsWith(marker + ' ') &&
      !value.startsWith(marker + marker)
    ) {
      const citeLength = pipe(
        CITE_REGEX.exec(value) ?? [],
        A.head,
        O.filter((match) => !(match.includes('.') && !match.endsWith('.'))), // Filter out email addresses, but not end of sentences
        O.getOrElse(() => ''),
        (match) => match.length
      )

      // Early termination if we don’t have a match
      if (citeLength === 0) return

      eat(value.substring(0, citeLength))({
        type: 'cite',
        value: value.substring(1, citeLength),
        data: {
          hName: 'cite',
        },
      })
    }
  }

  inlineTokenizer.locator = locator

  const Parser = this.Parser

  // Inject inlineTokenizer
  const inlineTokenizers = Parser.prototype.inlineTokenizers
  const inlineMethods = Parser.prototype.inlineMethods
  inlineTokenizers.citeRefs = inlineTokenizer
  inlineMethods.splice(inlineMethods.indexOf('text'), 0, 'citeRefs')
}
