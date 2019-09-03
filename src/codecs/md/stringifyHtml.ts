import * as A from 'fp-ts/lib/Array'
import * as O from 'fp-ts/lib/Option'
import { Node, Parent, Literal } from 'unist'
import { eqString } from 'fp-ts/lib/Eq'

const selfClosingTags = [
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr'
]

const parentNodeGuard = (n: Node): n is Parent => Array.isArray(n.children)

const joinHTML = (tree: Node[]): string =>
  tree.reduce(
    (value: string, node: Node) =>
      value + (typeof node.value === 'string' ? node.value : ''),
    ''
  )

const htmlTagRegExp = new RegExp(/<\/?(\w+)[\s>]/g)
const openingTagRegExp = new RegExp(/^<\w+/)

const isOpeningTag = (tag: string): boolean => openingTagRegExp.test(tag.trim())

/**
 * Returns a list of all opening and closing HTML tags. Note that this includs self-closing (void) elements.
 * @param {string} html String representation of HTML to parse.
 */
const getTags = (html: string): string[] => html.match(htmlTagRegExp) || []

/**
 * stringifyHTML takes a UNIST (Remark) node tree and merges content between `html` node types for further processing by
 * the Encoda HTML codec.
 * This is necessary as the original tree has content split into HTML fragments such as
 * `['<a href="#">', 'the inner content', '</a>']`, which the Codec does not know how to process.
 * This functions transforms the above into `['<a href="#">the inner content</a>']`
 * @param {(Node|Parent)} tree A UNIST Node which may or may not contain an array of child Nodes
 */
export const stringifyHTML = (tree: Node | Parent): Node => {
  if (!parentNodeGuard(tree)) return tree

  // This value allows us to skip over Nodes whose values have been merged into the new `fullHtml` node
  let skipUntil: number | undefined

  const fullHtmlNode = (value: string): Literal => ({
    type: 'fullHtml',
    value
  })

  const children = tree.children.reduce((innerTree: Node[], n: Node, idx) => {
    if (skipUntil && idx <= skipUntil) {
      return innerTree
    }

    // Recursively call `stringifyHTML` if the Node has children of its own
    if (n.children) {
      return [...innerTree, stringifyHTML(n)]
    }

    if (n.type === 'html' && typeof n.value === 'string') {
      const openingTag = A.lookup(1, n.value.match(/<(\w+)/) || A.empty)
      const isSelfClosing = A.elem(O.getEq(eqString))(
        openingTag,
        A.map(O.some)(selfClosingTags)
      )

      // If the element is self-closing, then the the HTML value is already fully formed
      if (isSelfClosing) {
        return [...innerTree, fullHtmlNode(n.value)]
      }

      // Keep a stack counting number of opening HTML tags we've encountered
      // This is used to avoid prematurely stopping gathering the HTML value, accounting for repeated nesting of the
      // same HTML tags like `<div><div>content</div></div>`
      let stack = 0
      const closingTagIdx = A.findIndex((e: Node) => {
        if (typeof e.value !== 'string') return false

        // Split HTML tags into two lists, one for opening and one for closings tags. We use the difference in their
        // lengths to determine if there are any unclosed HTML tags, and if we should continue consuming the value of
        // the next Node.
        const groupedTags = A.partition(isOpeningTag)(getTags(e.value))
        stack += groupedTags.right.length - groupedTags.left.length

        return stack === 0
      })(tree.children)

      // If we couldn't find the ending closing tag in this Node, don't skip any Nodes
      skipUntil = O.getOrElse<number>(() => idx)(closingTagIdx)

      // Now that we know where in the list of the children the HTML starts and stops, we can merge their values
      const subSet = tree.children.slice(idx, skipUntil + 1)

      return [...innerTree, fullHtmlNode(joinHTML(subSet))]
    }

    return [...innerTree, n]
  }, [])

  // Reset the skipUntil counter
  skipUntil = undefined

  return { ...tree, children }
}
