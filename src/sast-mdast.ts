import * as Unist from 'unist'
import * as Sast from './sast'

/**
 * Transform a [Markdown Abstract Syntax Tree](https://github.com/syntax-tree/mdast) to
 * a Stencila AST
 *
 * @param mdast The MDAST tree to transform
 */
export function from (mdast: Unist.Node): Sast.Node {
  // TODO: transform mdast to sast
  return mdast
}

/**
 *  Transfrom a Stencila AST to a Markdown AST
 *
 * @param sast The SAST tree to transform
 */
export function to (sast: Sast.Node): Unist.Node {
  // TODO: transform sast to mdast
  return sast as Unist.Node
}
