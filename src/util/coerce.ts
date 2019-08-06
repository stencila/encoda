import stencila, { isEntity, nodeType } from '@stencila/schema'
import Ajv from 'ajv'
import produce from 'immer'
import { getCoecer, getErrors, getSchema } from './schemas'

/**
 * Coerce a node so it conforms to a type's schema
 *
 * @param node The node to coerce
 * @param typeName The type to coerce it to
 */
export async function coerce<Key extends keyof stencila.Types>(
  node: stencila.Node,
  type?: Key
): Promise<stencila.Types[Key]> {
  if (type === undefined) type = nodeType(node) as Key
  const coecer = await getCoecer(type)

  return (produce(node, async (coerced: stencila.Node) => {
    if (coerced === null) return node
    // Change the type, since this is coercion to the specified type
    // @ts-ignore
    if (isEntity(coerced)) coerced.type = type
    // Rename property aliases
    await rename(coerced)
    // Coerce and validate
    try {
      return await coecer(coerced)
    } catch (error) {
      if (error instanceof Ajv.ValidationError)
        throw getErrors(coecer, node, error.errors)
      else throw error
    }
  }) as unknown) as stencila.Types[Key]

  // Replace aliases with canonical names
  async function rename(node: stencila.Node): Promise<void> {
    if (isEntity(node)) {
      const schema = await getSchema(node.type as Key)
      if (!schema.propertyAliases) return

      for (const [key, child] of Object.entries(node)) {
        const name = schema.propertyAliases[key]
        if (name) {
          // @ts-ignore
          node[name] = child
          // @ts-ignore
          delete node[key]
        }
        await rename(child)
      }
    } else if (Array.isArray(node)) {
      for (const child of node) {
        await rename(child)
      }
    }
  }
}
