// Remark plugin for Citation nodes
// Based on https://github.com/zestedesavoir/zmarkdown/blob/master/packages/remark-sub-super/src/index.js
// Encode Pandoc style `@`-prefixed citation e.g. `@smith04` strings into a custom `Cite` MDAST node type.

import { array as A, option as O } from 'fp-ts'
import { pipe } from 'fp-ts/lib/pipeable'
import { Eat, Locator, Parser, Tokenizer } from 'remark-parse'
import { Plugin } from 'unified'

const marker = '@'
/* Regex to find Pandoc style citations, but care needs to be taken to filter out email addresses.
 * Group 1: Possibly a citation target id
 * Group 2: Possibly the top level domain of an email address. If not empty, then the match is an email.
 */
const CITE_REGEX = /\B@([\w|-]+)(\.\w+)?/

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
      const matches = CITE_REGEX.exec(value) ?? []

      const isEmail = matches[2] !== undefined

      // Early termination if we’re dealing with an email and not a citation format
      if (isEmail) return

      const citeLength = pipe(
        matches,
        A.head,
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
