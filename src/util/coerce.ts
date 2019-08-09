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
    if (typeof coerced === 'object') coerced.type = type

    // Deep "reshape" node
    await reshape(coerced)

    // Coerce and validate using Ajv
    try {
      return await coecer(coerced)
    } catch (error) {
      if (error instanceof Ajv.ValidationError)
        throw getErrors(coecer, node, error.errors)
      else throw error
    }
  }) as unknown) as stencila.Types[Key]

  /**
   * Recursively walk through the node reshaping it
   * This function does several things that Ajv will not
   * do for us:
   *   - rename aliases to canonical property names
   *   - remove additional properties (not in schema);
   *     Ajv does this but with limitations when `anyOf` or `allOf`
   *     https://github.com/epoberezkin/ajv/blob/master/FAQ.md#additional-properties-inside-compound-keywords-anyof-oneof-etc
   *   - coerce an object to an `array` of objects and vice verse;
   *     Ajv does not do that https://github.com/epoberezkin/ajv/issues/992
   */
  async function reshape(node: stencila.Node): Promise<void> {
    if (isEntity(node)) {
      const schema = await getSchema(node.type as Key)
      const { properties = {}, propertyAliases = {} } = schema

      for (const [key, child] of Object.entries(node)) {
        let name = propertyAliases[key]
        if (name !== undefined) {
          // Aliased property
          // @ts-ignore
          node[name] = child
          // @ts-ignore
          delete node[key]
        } else if (properties[key] === undefined) {
          // Additional property, just delete, no need to reshape child
          // @ts-ignore
          delete node[key]
          continue
        } else {
          name = key
        }

        // Object to array of object
        const propertySchema = properties[name]
        if (
          propertySchema.type === 'array' &&
          typeof child === 'object' &&
          !Array.isArray(child)
        ) {
          // @ts-ignore
          node[name] = [child]
        }

        await reshape(child)
      }
    } else if (Array.isArray(node)) {
      for (const child of node) {
        await reshape(child)
      }
    }
  }
}
