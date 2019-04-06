// @ts-ignore
import parser from 'remark-parse'
// @ts-ignore
import frontmatter from 'remark-frontmatter'
// @ts-ignore
import genericExtensionsParser from 'remark-generic-extensions'
// @ts-ignore
import compact from 'mdast-util-compact'
// @ts-ignore
import stringifier from 'remark-stringify'
import unified from 'unified'
// @ts-ignore
import map from 'unist-util-map'
import * as UNIST from 'unist'

import { mdast2sast, sast2mdast } from './sast-mdast'
import { Node } from './sast'
import { load, VFile } from './vfile'

export const media = ['text/markdown', 'text/x-markdown', 'markdown', 'md']

/**
 * Options for `remark-frontmatter` parser and stringifier
 *
 * @see https://github.com/remarkjs/remark-frontmatter#matter
 */
const FRONTMATTER_OPTIONS = [{ type: 'yaml', marker: '-' }]

/**
 * Interface for generic extension nodes parsed by `remark-generic-extensions`.
 *
 * Inline extensions have the syntax:
 *
 * ```markdown
 * !Extension[Content](Argument){Properties}
 * ```
 *
 * Block extensions have the syntax:
 *
 * ```markdown
 * Extension: Argument
 * :::
 * [Content]
 * :::
 * {Properties}
 * ```
 */
interface ExtensionElement {
  /**
   * Name of the extension
   */
  extensionName: string

  /**
   * Content string
   */
  content: string

  /**
   * Argument string
   */
  argument: string

  /**
   * Map of computed properties
   */
  properties: { [key: string]: string }
}

/**
 * Enum for generic extension types
 */
enum ExtensionType {
  Inline = 'inline-extension',
  Block = 'block-extension'
}

/**
 * Generic extensions definitions.
 *
 * @see https://github.com/medfreeman/remark-generic-extensions#elements-object
 */
const GENERIC_EXTENSIONS = {
  elements: {
    connect: {
      replace: (type: ExtensionType, element: ExtensionElement) => {
        const node: { [key: string]: any } = {
          type: 'connect',
          content: element.content,
          resource: element.argument
        }
        if (element.properties.length) node.options = element.properties
        return node
      }
    },
    include: {
      replace: (type: ExtensionType, element: ExtensionElement) => {
        const node: { [key: string]: any } = {
          type: 'include',
          resource: element.argument
        }
        if (element.content) node.content = element.content
        if (element.properties.length) node.options = element.properties
        return node
      }
    }
  }
}

/**
 * Transform generic extensions back to MDAST
 *
 * We use `type: html` so no escaping of the value is done while stringifying.
 */
function transformExtensions(tree: UNIST.Node) {
  return map(tree, (node: any) => {
    switch (node.type) {
      case 'connect':
        return {
          type: 'html',
          value: `!connect[${node.content}](${node.resource})`
        }
      case 'include':
        return {
          type: 'html',
          value: `!include${node.content ? `[${node.content}]` : ''}(${
            node.resource
          })`
        }
    }
    return node
  })
}

export async function parse(file: VFile): Promise<Node> {
  const mdast = unified()
    .use(parser, {
      commonmark: true
    })
    .use(frontmatter, FRONTMATTER_OPTIONS)
    .use(genericExtensionsParser, GENERIC_EXTENSIONS)
    .parse(file)
  compact(mdast, true)
  return mdast2sast(mdast)
}

export async function unparse(node: Node): Promise<VFile> {
  let mdast = sast2mdast(node)
  mdast = transformExtensions(mdast)
  const md = unified()
    .use(stringifier)
    .use(frontmatter, FRONTMATTER_OPTIONS)
    .stringify(mdast)
  return load(md)
}
