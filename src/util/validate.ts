import stencila from '@stencila/schema'
import Ajv from 'ajv'
import { getErrorMessage, getValidator } from './schemas'

/**
 * Validate a node against a type schema
 *
 * @param node The node to validate
 * @param type The type to validate against
 */
export async function validate<Key extends keyof stencila.Types>(
  node: stencila.Node,
  type?: Key
): Promise<void> {
  if (type === undefined) type = stencila.nodeType(node) as Key
  const validator = await getValidator(type)
  try {
    await validator(node)
  } catch (error) {
    if (error instanceof Ajv.ValidationError)
      throw new Error(getErrorMessage(validator, node, error.errors))
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
