import * as stencila from '@stencila/schema'
import assert from 'assert'
import path from 'path'
import { dump, load, read, write } from '../src'
import { type, validate } from '../src/util'

/**
 * Process a document
 *
 * This function walks through a document and updates it according to
 * any processing directives on the nodes.
 */
export default async function process(
  filePath: string
): Promise<stencila.Node> {
  const doc = await read(filePath)

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

  return await handle(doc)

  function _import(name: string, node: stencila.Node) {
    nodes[name] = node
  }

  function _equals(name: string, node: stencila.Node) {
    assert.deepStrictEqual(node, _get(name))
  }

  function _get(name: string) {
    const node = nodes[name]
    if (typeof node === 'undefined') {
      throw Error(`Error in "${filePath}": could not find "${name}"`)
    }
    return node
  }

  async function _load(content: string, format: string) {
    try {
      const node = await load(content, format)
      validate(node, type(node))
      return node
    } catch (error) {
      throw Error(`Error in "${filePath}": loading "${content}": ${error} `)
    }
  }

  async function _read(target: string, format?: string) {
    try {
      const targetPath = './' + path.join(path.dirname(filePath), target)
      const node = await read(targetPath, format)
      validate(node, type(node))
      return node
    } catch (error) {
      throw Error(`Error in "${filePath}": reading "${target}": ${error} `)
    }
  }

  async function _write(node: stencila.Node, target: string, format?: string) {
    try {
      const targetPath = './' + path.join(path.dirname(filePath), target)
      await write(node, targetPath, format)
    } catch (error) {
      throw Error(`Error in "${filePath}": writing "${target}": ${error} `)
    }
  }
}
