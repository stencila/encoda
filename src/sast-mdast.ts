import * as Unist from 'unist'

import * as Sast from './sast'

/**
 * Transform a [Markdown Abstract Syntax Tree](https://github.com/syntax-tree/mdast) to
 * a Stencila AST
 *
 * @param mdast The MDAST tree to transform
 */
export function mdast2sast (mdast: Unist.Node): Sast.Node {
  function walk (node: Unist.Node) {
    if (!node.type) return
    
    // Rename types
    switch (node.type) {
      default:
        node.type = node.type.charAt(0).toUpperCase() + node.type.slice(1)
    }
    // Rename `position` to `$position` so it is not serialised
    if (node.position) {
      node.$position = node.position
      delete node.position
    }

    if (node.children) {
      for (let child of node.children as Array<Unist.Node>) walk(child)
    }
  }
  walk(mdast)
  return mdast
}

/**
 *  Transform a Stencila AST to a Markdown AST
 *
 * @param sast The SAST tree to transform
 */
export function sast2mdast (sast: Sast.Node): Unist.Node {
  function walk (node: Sast.Node) {
    if (!node.type) return
    
    // Rename types
    switch (node.type) {
      default:
        node.type = node.type.toLowerCase()
    }

    if (node.children) {
      for (let child of node.children as Array<Sast.Node>) walk(child)
    }
  }
  walk(sast)
  return sast as Unist.Node
}
