// Remark plugin for Citation nodes
// Based on https://github.com/zestedesavoir/zmarkdown/blob/master/packages/remark-sub-super/src/index.js
// Encode Pandoc style `@`-prefixed citation e.g. `@smith04` strings into a custom `Cite` MDAST node type.

import { array as A } from 'fp-ts'
import { Eat, Parser, Tokenizer } from 'remark-parse'
import { Plugin } from 'unified'

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
const NARRATIVE_REGEX = /@([\w-]+)(\.\w+)?(\s*\[([^\]]+)\])?/

/* Regex to find Pandoc style parenthetical citations (in square brackets)
 *
 * Group 1: Optional prefix
 * Group 2: Citation `target` id
 * Group 3: Optional suffix (if starts with period instead of space assumed to be email)
 * Group 4-: Possibly additional citations separated by colons
 *
 * See https://regex101.com/r/cPaCmO/1/
 */
const PARENTHETICAL_REGEX = /►(.*?)@([\w-]+)(.*?)((\s*;\s*.*?@[\w-]+.*?)*)?◄/

export const citePlugin: Plugin<[]> = function () {
  const inlineTokenizer: Tokenizer = function (
    this: Parser,
    eat: Eat,
    value: string
  ) {
    // Allow escaping of markers
    // @ts-expect-error
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (!this.escape.includes('@')) this.escape.push('@')

    // Parenthetical citations
    if (value[0] === '►') {
      const match = PARENTHETICAL_REGEX.exec(value)

      // Early termination if we don’t have a match
      if (!match) return

      const [_all, prefix, target, suffix, more] = match

      // Early termination if we’re dealing with an email link
      if (
        more !== undefined &&
        /\w$/.test(prefix) &&
        /\.[a-z]{2,}/.test(suffix)
      )
        return

      let groups = [[prefix, target, suffix]]
      if (more !== undefined) {
        groups = [
          ...groups,
          ...more
            .split(/\s*;\s*/)
            .slice(1)
            .map((cite) => (/^(.*?)@([\w-]+)(.*?)$/.exec(cite) ?? []).slice(1)),
        ]
      }

      // Handle potentially more than one Cite
      const items = groups.map(([prefix, target, suffix]) => {
        if (prefix !== undefined) prefix = prefix.trim()
        if (suffix !== undefined) suffix = suffix.trim()

        return {
          type: 'Cite',
          target,
          prefix: prefix === '' ? undefined : prefix,
          suffix: suffix === '' ? undefined : suffix,
        }
      })

      eat(match[0])(
        items.length === 1
          ? { type: 'cite', data: items[0] }
          : { type: 'citeGroup', data: { items } }
      )
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

      // Early termination if we’re dealing with an email
      if (domain !== undefined) return

      eat(match[0])({
        type: 'cite',
        data: { type: 'Cite', citationMode: 'Narrative', target, suffix },
      })
    }
  }

  // Locate the first of either of the starting characters in a string
  inlineTokenizer.locator = (value, fromIndex) => {
    const found = []

    const index1 = value.indexOf('►', fromIndex)
    if (index1 !== -1) found.push(index1)

    const index2 = value.indexOf('@', fromIndex)
    if (index2 !== -1) found.push(index2)

    if (!A.isEmpty(found)) {
      found.sort((a, b) => a - b)
      return found[0]
    }

    return -1
  }

  // Inject into parser
  const Parser = this.Parser
  const inlineTokenizers = Parser.prototype.inlineTokenizers
  inlineTokenizers.citeRefs = inlineTokenizer
  const inlineMethods = Parser.prototype.inlineMethods
  inlineMethods.splice(inlineMethods.indexOf('text'), 0, 'citeRefs')
}
