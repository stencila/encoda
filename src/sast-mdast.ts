import * as Unist from 'unist'

import * as Sast from './sast'

/**
 * Transform a [Markdown Abstract Syntax Tree](https://github.com/syntax-tree/mdast) to
 * a Stencila AST
 *
 * @param node The MDAST tree to transform
 */
export function mdast2sast (node: Unist.Node): Sast.Node {
  switch (node.type) {
    case 'root': return documentFromRoot(node)
    default: return defaultFrom(node)
  }
}

/**
 *  Transform a Stencila AST to a Markdown AST
 *
 * @param node The SAST tree to transform
 */
export function sast2mdast (node: Sast.Node): Unist.Node {
  switch (node.type) {
    case 'Document': return documentToRoot(node)
    default: return defaultTo(node)
  }
}

function documentFromRoot (node: Unist.Node): Sast.Node {
  return {
    type: 'Document',
    body: (node.children as Array<Unist.Node>).map(mdast2sast)
  }
}

function documentToRoot (node: Sast.Node): Unist.Node {
  return {
    type: 'root',
    children: (node.body as Array<Sast.Node>).map(sast2mdast)
  }
}

function defaultFrom (mdast: Unist.Node): Sast.Node {
  const sast: Sast.Node = {
    type: mdast.type.charAt(0).toUpperCase() + mdast.type.slice(1)
  }
  for (let [key, child] of Object.entries(mdast)) {
    if (!['type', 'position'].includes(key)) {
      if (Array.isArray(child)) sast[key] = (child as Array<Unist.Node>).map(mdast2sast)
      else if (child !== null && typeof child === 'object') sast[key] = mdast2sast(child as Unist.Node)
      else sast[key] = child
    }
  }
  return sast
}

function defaultTo (sast: Sast.Node): Unist.Node {
  const mdast: Unist.Node = {
    type: sast.type.toLowerCase()
  }
  for (let [key, child] of Object.entries(sast)) {
    if (!['type'].includes(key)) {
      if (Array.isArray(child)) mdast[key] = (child as Array<Unist.Node>).map(sast2mdast)
      else if (child !== null && typeof child === 'object') mdast[key] = sast2mdast(child as Unist.Node)
      else mdast[key] = child
    }
  }
  return mdast
}
