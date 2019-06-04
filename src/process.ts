import stencila from '@stencila/schema'
import assert from 'assert'
import path from 'path'
import { dump, load, read, write } from '.'
import { type, validate } from './util'
import { isPath } from './vfile'

/**
 * Process a node
 *
 * This function walks through a node and updates it according to
 * any processing directives on the nodes.
 */
export default async function process(
  node: stencila.Node,
  dir: string = ''
): Promise<stencila.Node> {
  // A dictionary of nodes assigned to by `import` and used
  // by other directives
  const nodes: { [key: string]: stencila.Node } = {}

  async function handle(node: any): Promise<stencila.Node> {
    if (node === null || typeof node !== 'object') return node

    if (node.type === 'CodeBlock') {
      const code = node as stencila.CodeBlock
      const meta = code.meta
      if (meta) {
        if ('validate' in meta) {
          await _load(code.value, meta.from || code.language)
        }
        if (meta.id) {
          _import(meta.id, node)
        }
        if (meta.import) {
          _import(
            meta.import,
            await _load(code.value, meta.from || code.language)
          )
        }
        if (meta.export) {
          code.value = await dump(_get(meta.export), meta.to || code.language)
        }
        if (meta.equals) {
          _equals(
            meta.equals,
            await _load(code.value, meta.from || meta.to || code.language)
          )
        }
        if ('include' in meta) {
          return await _load(code.value, meta.from || code.language)
        }
      }
    }

    if (node.type === 'Link') {
      const link = node as stencila.Link
      // @ts-ignore
      const meta = link.meta
      if (meta) {
        if ('validate' in meta) {
          await _read(link.target, meta.from)
        }
        if (meta.import) {
          _import(meta.import, await _read(link.target, meta.from))
        }
        if (meta.export) {
          await _write(_get(meta.export), link.target, meta.to)
        }
        if (meta.equals) {
          _equals(meta.equals, await _read(link.target, meta.from || meta.to))
        }
        if ('include' in meta) {
          return await _read(link.target, meta.from)
        }
      }
    }

    if (node.type === 'Paragraph') {
      const para = node as stencila.Paragraph
      // Paragraphs that have a string which looks like a file path
      // are treated as an inclusion. This approximates the transclusion
      // syntax of iA Writer.
      if (para.content.length === 1) {
        if (type(para.content[0]) === 'string') {
          const path = para.content[0] as string
          if (isPath(path)) {
            return await _read(path)
          }
        }
      }
    }

    if (node.type === 'ImageObject') {
      const img = node as stencila.ImageObject
      // @ts-ignore
      const meta = img.meta
      if (meta && img.contentUrl) {
        if ('validate' in meta) {
          await _read(img.contentUrl, meta.from)
        }
        if (meta.import) {
          _import(meta.import, await _read(img.contentUrl, meta.from))
        }
        if (meta.export) {
          await _write(_get(meta.export), img.contentUrl, meta.to)
        }
        if (meta.equals) {
          _equals(
            meta.equals,
            await _read(img.contentUrl, meta.from || meta.to)
          )
        }
      }
    }

    for (const [key, child] of Object.entries(node)) {
      node[key] = await handle(child)
    }

    return node
  }

  return await handle(node)

  function _import(id: string, node: stencila.Node) {
    nodes[id] = node
  }

  function _equals(id: string, node: stencila.Node) {
    assert.deepStrictEqual(node, _get(id))
  }

  function _get(id: string) {
    const node = nodes[id]
    if (typeof node === 'undefined') {
      throw Error(`Error: could not find "${id}"`)
    }
    return node
  }

  async function _load(content: string, format: string) {
    try {
      const node = await load(content, format)
      validate(node, type(node))
      return node
    } catch (error) {
      throw Error(`Error: loading "${content}": ${error} `)
    }
  }

  async function _read(target: string, format?: string) {
    try {
      const targetPath = './' + path.join(dir, target)
      const node = await read(targetPath, format)
      validate(node, type(node))
      return node
    } catch (error) {
      throw Error(`Error: reading "${target}": ${error} `)
    }
  }

  async function _write(node: stencila.Node, target: string, format?: string) {
    try {
      const targetPath = './' + path.join(dir, target)
      await write(node, targetPath, format)
    } catch (error) {
      throw Error(`Error: writing "${target}": ${error} `)
    }
  }
}
