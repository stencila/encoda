import * as A from 'fp-ts/lib/Array'
import * as O from 'fp-ts/lib/Option'
import { Node, Parent } from 'unist'

const eatHtml = (closingIdx: number) => (hs: Node[]) =>
  A.takeLeft(closingIdx)(hs).reduce(
    (v: string, e) => v + (typeof e.value === 'string' ? e.value : ''),
    ''
  )

const parentGuard = (n: Node): n is Parent => Array.isArray(n.children)

export const stringifyHTML = (node: Node | Parent): Node => {
  if (!parentGuard(node)) return node

  let skipTill: number | undefined

  const ch = node.children.reduce((cs: Node[], c: Node, idx) => {
    if (skipTill && idx <= skipTill) {
      return cs
    }

    if (c.children) {
      return [...cs, stringifyHTML(c)]
    }

    if (c.type === 'html' && typeof c.value === 'string') {
      const _Tag = c.value.match(/<(\w+)/)
      const selfClosing = c.value.includes('/>')

      const openingTag = _Tag ? _Tag[1] : 0

      let stack = 0
      const closing = A.findIndex((e: Node) => {
        if (typeof e.value !== 'string') return false
        if (selfClosing) return true

        if (e.value.includes(`<${openingTag}`)) {
          stack++
        } else if (e.value.includes(`</${openingTag}`)) {
          stack--
        }

        return stack === 0 && e.value.includes(`</${openingTag}`)
      })(node.children)

      const closingIdx = O.getOrElse<number>(() => 0)(closing) + 1
      skipTill = closingIdx

      return [
        ...cs,
        {
          type: 'fullHtml',
          value: eatHtml(closingIdx)(A.dropLeft(idx)(node.children))
        }
      ]
    }

    return [...cs, c]
  }, [])

  return { ...node, children: ch }
}
