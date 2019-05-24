/**
 * A module for generating documentation
 */

import * as stencila from '@stencila/schema'
import assert from 'assert'
import globby from 'globby'
import path from 'path'
import { dump, load, read, write } from './src'
import { type, validate } from './src/util'

const glob = process.argv[2] || 'docs/*.md'
renderAll(glob)

/**
 * Render all Markdown files in `docs`.
 */
async function renderAll(glob: string) {
  console.error(`Rendering glob: "${glob}"`)
  const filePaths = await globby(glob)
  Promise.all(filePaths.map(render))
}

/**
 * Render a file's `CodeBlock` nodes back to the
 * original format (usually `.md`) and `.html`.
 */
async function render(filePath: string): Promise<void> {
  console.error(`Rendering file: "${filePath}"`)
  const doc = await read(filePath)

  // Walk the tree and process `CodeBlock` nodes
  const nodes: { [key: string]: stencila.Node } = {}
  async function convert(node: any): Promise<stencila.Node> {
    if (node === null || typeof node !== 'object') return node

    if (node.type === 'CodeBlock') {
      const code = node as stencila.CodeBlock
      if (code.meta) {
        if (code.meta.load || code.meta.equals) {
          const format = code.meta.from || code.language || ''
          let value

          try {
            value = await load(code.value, format)
            validate(value, type(value))
          } catch (error) {
            throw Error(`Error in "${filePath}": in "${code.value}": ${error} `)
          }

          if (code.meta.load) {
            nodes[code.meta.load] = value
          }
          if (code.meta.equals) {
            const other = nodes[code.meta.equals]
            if (typeof other === 'undefined') {
              throw Error(
                `Error in "${filePath}": could not find "${code.meta.equals}"`
              )
            }
            assert.deepStrictEqual(value, other)
          }
        } else if (code.meta.dump) {
          const other = nodes[code.meta.dump]
          if (typeof other === 'undefined') {
            throw Error(
              `Error in "${filePath}": could not find "${code.meta.dump}"`
            )
          }
          const format = code.meta.to || code.language || ''
          code.value = await dump(other, format)
        }
      }
    }

    if (node.type === 'Link') {
      const link = node as stencila.Link
      // @ts-ignore
      const meta = link.meta
      if (meta) {
        if (meta.read) {
          let value
          try {
            value = await read(link.target)
            validate(value, type(value))
          } catch (error) {
            throw Error(`Error in "${filePath}": in "${meta.read}": ${error} `)
          }
          nodes[meta.read] = value
        } else if (meta.write) {
          const other = nodes[meta.write]
          if (typeof other === 'undefined') {
            throw Error(
              `Error in "${filePath}": could not find "${meta.write}"`
            )
          }
          await write(other, link.target)
        }
      }
    }

    for (const [key, child] of Object.entries(node)) {
      node[key] = await convert(child)
    }

    return node
  }
  await convert(doc)

  // Write back to file
  write(doc, filePath)

  // Write to HTML
  const { dir, name } = path.parse(filePath)
  const htmlPath = path.join(dir, name + '.html')
  write(doc, htmlPath, 'html')
}
