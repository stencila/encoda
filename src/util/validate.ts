import * as stencila from '@stencila/schema'
import { nodeType } from '@stencila/schema/dist/util'
import Ajv from 'ajv'
import { getErrors, getValidator } from './schemas'

/**
 * Validate a node against a type schema
 *
 * @param node The node to validate
 * @param type The type to validate against
 */
export async function validate<Key extends keyof stencila.Types>(
  node: stencila.Node,
  type?: Key
): Promise<stencila.Types[Key]> {
  if (type === undefined) type = nodeType(node) as Key
  const validator = await getValidator(type)
  try {
    return await validator(node)
  } catch (error) {
    if (error instanceof Ajv.ValidationError)
      throw getErrors(validator, node, error.errors)
    else throw error
  }
}

/**
 * Is a node valid with respect to a particular type schema
 *
 * @param node The node to check
 * @param type The type to check against
 */
export async function isValid<Key extends keyof stencila.Types>(
  node: stencila.Node,
  type?: Key
): Promise<boolean> {
  try {
    await validate(node, type)
    return true
  } catch (error) {
    return false
  }
}
