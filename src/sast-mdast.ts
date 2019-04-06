import { Thing } from '@stencila/schema'
import * as yaml from 'js-yaml'
import * as MDAST from 'mdast'
import * as UNIST from 'unist'

/**
 * Transform a [Markdown Abstract Syntax Tree](https://github.com/syntax-tree/mdast) to
 * a Stencila AST
 *
 * @param node The MDAST tree to transform
 */
export function mdast2sast(node: UNIST.Node): Thing {
  switch (node.type) {
    case 'root':
      return documentFromRoot(node as MDAST.Root)
    default:
      return defaultFrom(node)
  }
}

/**
 *  Transform a Stencila AST to a Markdown AST
 *
 * @param node The SAST tree to transform
 */
export function sast2mdast(node: Thing): UNIST.Node {
  switch (node.type) {
    case 'Document':
      return documentToRoot(node)
    default:
      return defaultTo(node)
  }
}

/**
 * Convert a MDAST `Root` node to a SAST `Document`
 *
 * If the root has a front matter node (defined using YAML), that
 * meta data is added to the top level of the document. Other
 * child nodes are added to the document's `body` property.
 *
 * @param root The MDAST root to convert
 */
function documentFromRoot(root: MDAST.Root): Thing {
  const doc: Thing = {
    type: 'Document'
  }
  const body: Array<Thing> = []
  for (let child of root.children) {
    if (child.type === 'yaml') {
      const frontmatter = yaml.safeLoad(child.value)
      for (let [key, value] of Object.entries(frontmatter)) {
        doc[key] = value
      }
    } else {
      body.push(mdast2sast(child))
    }
  }
  doc.body = body
  return doc
}

/**
 * Convert a SAST `Document` to a MDAST `Root`
 *
 * The document's `body` property becomes the root's `children`
 * and any other properties are serialized as YAML
 * front matter and prepended to the children.
 *
 * @param node The SAST document to convert
 */
function documentToRoot(node: Thing): MDAST.Root {
  const root: MDAST.Root = {
    type: 'root',
    children: []
  }
  const frontmatter: { [key: string]: any } = {}
  for (let [key, value] of Object.entries(node)) {
    if (!['type', 'body'].includes(key)) {
      frontmatter[key] = value
    } else {
      root.children = node.body.map(sast2mdast)
    }
  }
  if (Object.keys(frontmatter).length) {
    const yamlNode: MDAST.YAML = {
      type: 'yaml',
      value: yaml.safeDump(frontmatter).trim()
    }
    root.children.unshift(yamlNode)
  }
  return root
}

function defaultFrom(mdast: UNIST.Node): Thing {
  const sast: Thing = {
    type: mdast.type.charAt(0).toUpperCase() + mdast.type.slice(1)
  }
  for (let [key, child] of Object.entries(mdast)) {
    if (!['type', 'position'].includes(key)) {
      if (Array.isArray(child)) {
        sast[key] = (child as Array<UNIST.Node>).map(mdast2sast)
      } else if (child !== null && typeof child === 'object') {
        sast[key] = mdast2sast(child as UNIST.Node)
      } else sast[key] = child
    }
  }
  return sast
}

function defaultTo(sast: Thing): UNIST.Node {
  const mdast: { [key: string]: any } = {
    type: sast.type.toLowerCase()
  }
  for (let [key, child] of Object.entries(sast)) {
    if (!['type'].includes(key)) {
      if (Array.isArray(child)) {
        mdast[key] = (child as Array<UNIST.Node>).map(sast2mdast)
      } else if (child !== null && typeof child === 'object' && child.type) {
        mdast[key] = sast2mdast(child as UNIST.Node)
      } else mdast[key] = child
    }
  }
  return mdast as UNIST.Node
}
