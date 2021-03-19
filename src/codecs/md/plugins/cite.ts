// Remark plugin for Citation nodes
// Based on https://github.com/zestedesavoir/zmarkdown/blob/master/packages/remark-sub-super/src/index.js
// Encode Pandoc style `@`-prefixed citation e.g. `@smith04` strings into a custom `Cite` MDAST node type.

import { array as A } from 'fp-ts'
import { Eat, Locator, Parser, Tokenizer } from 'remark-parse'
import { Plugin } from 'unified'

const marker = '@'

/* Regex to find Pandoc style narrative citations (not enclosed in brackets)
 *
 * Group 1: Citation `target` id
 * Group 2: Possibly the top level domain of an email address.
 *          If not empty, then the match is an email. For some reason can't use
 *          a negative lookahead for this and need to deal with in plugin logic
 * Group 3: Optional citation `suffix`
 *
 * See https://regex101.com/r/G6zvyw/2
 */
const NARRATIVE_REGEX = /\B@([\w-]+)(\.\w+)?\s*(\[([^\]]+)\])?/

/* Regex to find Pandoc style parenthetical citations (in square brackets)
 *
 * Group 1: Optional prefix
 * Group 2: Citation `target` id
 * Group 3: Optional suffix (if starts with period instead of space assumed to be email)
 * Group 4-: Possibly additional citations separated by colons
 *
 * See https://regex101.com/r/cPaCmO/1/
 */
const PARENTHETICAL_REGEX = /\B\[(.*?)@([\w-]+)(.*?)(\s*;\s*(.*?)@([\w-]+)(.*?))*\]/

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
    // Allow escaping of markers
    // @ts-expect-error
    // eslint-disable @typescript-eslint/strict-boolean-expressions
    if (!this.escape.includes('[')) this.escape.push('[')
    // @ts-expect-error
    // eslint-disable @typescript-eslint/strict-boolean-expressions
    if (!this.escape.includes('@')) this.escape.push('@')

    // Parenthetical citations
    if (
      value[0] === '[' &&
      !value.startsWith('[ ') &&
      !value.startsWith('[[')
    ) {
      const match = PARENTHETICAL_REGEX.exec(value)

      // Early termination if we don’t have a match
      if (!match) return

      const [_0, prefix, target, suffix, ...rest] = match

      // Early termination if we’re dealing with an email, not a citation
      if (rest.length === 0 && /\.[a-z]{2,}/.test(suffix)) return

      eat(value)({
        type: 'cite',
        data: { type: 'Cite', target, prefix, suffix },
      })
    }

    // Narrative citations
    else if (
      value[0] === '@' &&
      !value.startsWith('@ ') &&
      !value.startsWith('@@')
    ) {
      const match = NARRATIVE_REGEX.exec(value)

      // Early termination if we don’t have a match
      if (!match) return

      const [_0, target, domain, _3, suffix] = match

      // Early termination if we’re dealing with an email, not a citation
      if (domain) return

      eat(value)({
        type: 'cite',
        data: { type: 'Cite', citationMode: 'Narrative', target, suffix },
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
