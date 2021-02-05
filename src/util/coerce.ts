import stencila, { isEntity, nodeType } from '@stencila/schema'
import Ajv from 'ajv'
import { getCoecer, getErrorMessage, getSchema } from './schemas'
import { getLogger } from '@stencila/logga'

const log = getLogger('encoda:coerce')

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

  // Change the type given that this is coercion to the specified type
  if (typeof node === 'object' && node !== null && !Array.isArray(node))
    node.type = type

  // Deep "reshape" node
  await reshape(node)

  // Coerce and validate using Ajv
  try {
    return await coecer(node)
  } catch (error) {
    if (error instanceof Ajv.ValidationError)
      throw new Error(getErrorMessage(coecer, node, error.errors, 'cli'))
    else throw error
  }

  /**
   * Recursively walk through the node reshaping it
   *
   * This function does several things that Ajv will not
   * do for us:
   *   - rename aliases to canonical property names
   *   - remove additional properties (not in schema);
   *     Ajv does this but with limitations when `anyOf` etc are used
   *     https://github.com/epoberezkin/ajv/blob/master/FAQ.md#additional-properties-inside-compound-keywords-anyof-oneof-etc
   *   - coerce an object to an array of objects;
   *     Ajv does not do that https://github.com/epoberezkin/ajv/issues/992
   *   - coerce an array with length > 1 to a scalar;
   *     Ajv (understandably) only does this if length == 1
   *   - for required properties, use default values, or
   *     "empty" values (e.g. `[]` for arrays, `''` for strings)
   */
  async function reshape(node: stencila.Node): Promise<void> {
    if (isEntity(node)) {
      const schema = await getSchema(node.type)
      const { properties = {}, propertyAliases = {}, required = [] } = schema

      // Coerce properties...
      for (const [key, child] of Object.entries(node)) {
        // Match key to a property name...
        let name: string | undefined
        if (properties[key] !== undefined) {
          // `key` is a canonical property name, so just use it
          name = key
        } else {
          // Does the key match a property name, or an alias, after
          // conversion to lower camel case?
          // Replace spaces, hyphens or underscores followed by lowercase
          // letter to uppercase letter
          const lcc = key.replace(
            /( |-|_)([a-z])/g,
            (match, separator, letter) => letter.toUpperCase()
          )
          name = properties[lcc] !== undefined ? lcc : propertyAliases[lcc]
          if (name !== undefined) {
            // Rename aliased property
            // @ts-ignore
            node[name] = child
            // @ts-ignore
            delete node[key]
          } else if (properties[key] === undefined) {
            // Remove additional property (no need to reshape child, so continue)
            log.warn(`Ignoring property ${node.type}.${key}`)
            // @ts-ignore
            delete node[key]
            continue
          }
        }

        const propertySchema = properties[name]
        const isArray = Array.isArray(child)
        if (
          propertySchema.type === 'array' &&
          !isArray &&
          typeof child === 'object'
        ) {
          // Coerce a single object to an array
          // Do not do this for primitives since Ajv will do that for us
          // and to keep strings as strings for possible decoding via
          // the `codec` keyword
          // @ts-ignore
          node[name] = [child]
        } else if (
          propertySchema.type !== undefined &&
          ['string', 'number', 'boolean', 'object', 'integer'].includes(
            propertySchema.type.toString()
          ) &&
          isArray
        ) {
          // Coerce an array to a scalar by taking the first element
          if (child.length > 1)
            log.warn(`Ignoring all but first item in ${node.type}.${key}`)
          // @ts-ignore
          node[name] = child[0]
        }

        await reshape(child)
      }

      // Add missing values
      for (const name of required) {
        if (!(name in node)) {
          const propertySchema = properties[name]
          let value: null | boolean | number | string | [] | {}
          if (propertySchema.default !== undefined) {
            value = propertySchema.default
          } else {
            switch (propertySchema.type) {
              case 'null':
                value = null
                break
              case 'boolean':
                value = false
                break
              case 'number':
              case 'integer':
                value = 0
                break
              case 'string':
                value = ''
                break
              case 'array':
                value = []
                break
              case 'object':
                value = {}
                break
              default:
                // Default to empty string because most likely to be
                // able to be coerced elsewhere
                value = ''
            }
          }
          // @ts-ignore
          node[name] = value
        }
      }
    } else if (Array.isArray(node)) {
      for (const child of node) {
        await reshape(child)
      }
    }
  }
}
