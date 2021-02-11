import * as A from 'fp-ts/lib/Array'
import { eqString } from 'fp-ts/lib/Eq'
import { not } from 'fp-ts/lib/function'
import * as O from 'fp-ts/lib/Option'
import { Literal, Node, Parent } from 'unist'
import { log } from '.'

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
  'wbr',
]

const parentNodeGuard = (n: Node): n is Parent => Array.isArray(n.children)

const joinHTML = (tree: Node[]): string =>
  tree.reduce((acc: string, node: Node) => {
    let value = ''
    if (typeof node.value === 'string') {
      value = node.value
    } else {
      log.warn(
        `Nested Markdown inside HTML content is not currently supported in Markdown documents`
      )
    }

    return acc + value
  }, '')

const htmlTagRegExp = /<\/?(\w+)[\s>]/g
const openingTagRegExp = /^<\w+/

const isOpeningTag = (tag: string): boolean => openingTagRegExp.test(tag.trim())

const isSelfClosing = (tag: string): boolean =>
  A.elem(eqString)(tag.replace(/[</>]/, '').trim(), selfClosingTags)

/**
 * Returns a list of all opening and closing HTML tags.
 * Note that self-closing (void) elements are filtered out.
 * @param {string} html String representation of HTML to parse.
 */
const getTags = (html: string): string[] =>
  (html.match(htmlTagRegExp) ?? []).filter(not(isSelfClosing))

// Helper function for wrapping HTML string content in a custom MDAST style object
const fullHtmlNode = (value: string): Literal => ({
  type: 'html',
  value,
})

const getClosingTagIdx = (tree: Node[]): O.Option<number> => {
  // Keep a stack counting number of opening HTML tags we've encountered
  // This is used to avoid prematurely stopping gathering the HTML value, accounting for repeated nesting of the
  // same HTML tags like `<div><div>content</div></div>`
  let stack = 0
  return A.findIndex((node: Node) => {
    if (typeof node.value !== 'string') return false

    // Split HTML tags into two lists, one for opening and one for closings tags. We use the difference in their
    // lengths to determine if there are any unclosed HTML tags, and if we should continue consuming the value of
    // the next Node.
    const groupedTags = A.partition(isOpeningTag)(getTags(node.value))
    stack += groupedTags.right.length - groupedTags.left.length

    return stack === 0
  })(tree)
}

/**
 * stringifyHTML takes a MDAST (Remark) node tree and merges content between `html` node types for further processing by
 * the Encoda HTML codec.
 * This is necessary as the original tree has content split into HTML fragments such as
 * `['<a href="#">', 'the inner content', '</a>']`, which the Codec does not know how to process.
 * This functions transforms the above into `['<a href="#">the inner content</a>']`
 * @param {(Node|Parent)} tree A MDAST Node which may or may not contain an array of child Nodes
 */
export const stringifyHTML = (tree: Node | Parent): Node => {
  if (!parentNodeGuard(tree)) return tree

  // This value allows us to skip over Nodes whose values have been merged into the new `fullHtml` node
  let skipUntil: number | undefined

  const children = tree.children.reduce(
    (innerTree: Node[], node: Node, idx: number) => {
      if (skipUntil !== undefined && idx <= skipUntil) {
        return innerTree
      }

      // Recursively call `stringifyHTML` if the Node has children of its own
      if (node.children !== undefined) {
        return [...innerTree, stringifyHTML(node)]
      }

      if (node.type === 'html' && typeof node.value === 'string') {
        // Find the node index containing corresponding closing HTML tag.
        const subsequentNodes = A.dropLeft(idx)(tree.children)
        const closingTagIdx = O.getOrElse(() => 0)(
          getClosingTagIdx(subsequentNodes)
        )

        // If we couldn't find the final closing tag in this Node, don't skip any Nodes
        skipUntil = closingTagIdx + idx

        // Now that we know where in the list of the children the HTML start and end, we can merge their values
        // `closingTagIdx` is zero based, so add 1 to translate to the number of elements we want to take
        const subSet = A.takeLeft(closingTagIdx + 1)(subsequentNodes)
        return [...innerTree, fullHtmlNode(joinHTML(subSet))]
      }

      return [...innerTree, node]
    },
    []
  )

  return { ...tree, children }
}
