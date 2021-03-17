/**
 * @module schemas
 *
 * Several other modules use the JSON Schemas from `@stencila/schema`.
 * This module provides a single place for lazily, and asynchronously,
 * loading the schemas to avoid each of those other modules duplicating
 * that effort.
 */

import stencila, { JsonSchema } from '@stencila/schema'
import Ajv from 'ajv'
import betterAjvErrors from 'better-ajv-errors'
import fs from 'fs-extra'
import path from 'path'
import { match } from '..'
import * as vfile from './vfile'
import { getLogger } from '@stencila/logga'

const log = getLogger('encoda:coerce')

/**
 * Cache of `Schema` objects
 */
const schemas = new Map<string, JsonSchema>()

/**
 * Cache of compiled schema validation functions
 */
const validators = new Ajv({
  // For better error reporting
  jsonPointers: true,
  // Function to asynchronously load the schemas on demand
  loadSchema,
})

/**
 * Cache of coercion / validations functions
 * These use Ajv options that coerce nodes so we
 * keep them separate from non-mutating, purely validating,
 * functions.
 *
 * Using either `useDefaults` and `removeAdditional` options
 * leads to issues with sub-schemas with `anyOf` e.g. `BlockContent`.
 * See:
 *   - https://github.com/epoberezkin/ajv/blob/master/FAQ.md#additional-properties-inside-compound-keywords-anyof-oneof-etc
 *   - https://github.com/epoberezkin/ajv/issues/276
 */
const coercers = new Ajv({
  // For better error reporting
  jsonPointers: true,
  // Coerce type of data to match type keyword and coerce scalar
  // data to an array with one element and vice versa, as needed.
  coerceTypes: 'array',
  // Function to asynchronously load the schemas on demand
  loadSchema,
})

const schemasPath = path.dirname(require.resolve('@stencila/schema'))

/**
 * Get the version of the `@stencila/schema` package.
 */
export async function getVersion(
  which: 'major' | 'minor' | 'patch' = 'patch'
): Promise<string> {
  const pkg = await fs.readJson(path.join(schemasPath, '..', 'package.json'))
  if (which === 'patch') return pkg.version
  else
    return pkg.version
      .split('.')
      .slice(0, which === 'major' ? 1 : 2)
      .join('.')
}

/**
 * Read a JSON Schema file from `@stencila/schema`
 *
 * Adds the `"$async": true` keyword so that async validation, with async codec
 * keyword, can be done. See https://github.com/epoberezkin/ajv#asynchronous-validation
 */
export async function readSchema<Key extends keyof stencila.Types>(
  type: Key
): Promise<JsonSchema> {
  try {
    const schema = await fs.readJSON(
      path.join(schemasPath, `${type}.schema.json`)
    )

    // The $async keyword and in any definitions schemas
    // See https://github.com/epoberezkin/ajv/issues/647#issuecomment-350494536
    schema.$async = true
    if (schema.definitions !== undefined) {
      for (const definition of Object.values(schema.definitions)) {
        if (typeof definition === 'object') (definition as any).$async = true
      }
    }

    schemas.set(type, schema)
    return schema
  } catch (error) {
    if (error.code === 'ENOENT')
      throw new Error(`No schema for type "${type}".`)
    throw error
  }
}

/**
 * Get a schema based on its name
 */
export async function getSchema<Key extends keyof stencila.Types>(
  type: Key
): Promise<JsonSchema> {
  const schema = schemas.get(type)
  return schema !== undefined ? schema : readSchema(type)
}

/**
 * Load a schema based on its URI
 */
export async function loadSchema(uri: string): Promise<JsonSchema> {
  const match = /([\w]+)\.schema\.json$/.exec(uri)
  if (match !== null) return getSchema(match[1] as keyof stencila.Types)
  throw new Error(`Can not resolve schema "${uri}"`)
}

/**
 * Get the `Ajv` validation function for a type
 */
export async function getValidator<Key extends keyof stencila.Types>(
  type: Key,
  ajv: Ajv.Ajv = validators
): Promise<Ajv.ValidateFunction> {
  let validator = ajv.getSchema(
    `https://stencila.github.com/schema/${type}.schema.json`
  )
  if (validator === undefined) {
    const schema = await getSchema(type)
    validator = await ajv.compileAsync(schema)
  }
  return validator
}

/**
 * Get the `Ajv` coercing function for a type
 */
export async function getCoecer<Key extends keyof stencila.Types>(
  type: Key
): Promise<Ajv.ValidateFunction> {
  return getValidator(type, coercers)
}

/**
 * Custom validation function that handles the `codec`
 * keyword for coercing functions.
 *
 * If the codec is not found a warning is emitted but
 * it is not an error.
 */
const codecCoerce: Ajv.SchemaValidateFunction = async (
  codecName: string,
  data: string,
  parentSchema?: object,
  dataPath?: string,
  parentData?: object | unknown[],
  parentDataProperty?: string | number
  // rootData?: object | any[]
): Promise<boolean> => {
  function raise(msg: string): void {
    throw new Ajv.ValidationError([
      {
        keyword: 'decoding',
        dataPath: dataPath ?? '',
        schemaPath: '',
        params: {
          keyword: 'codec',
        },
        message: msg,
        data: data,
      },
    ])
  }

  let codec
  try {
    codec = await match(undefined, codecName)
  } catch (error) {
    if (error.message.startsWith('No codec could be found') === true) {
      log.warn(error.message)
      return true
    } else throw error
  }

  let decoded: stencila.Node
  try {
    decoded = await codec.decode(vfile.load(data))
  } catch (error) {
    const decodeError = error.message.split('\n')[0]
    raise(`error using "${codecName}" codec: ${decodeError}`)
  }

  if (parentData !== undefined && parentDataProperty !== undefined) {
    // @ts-ignore
    parentData[parentDataProperty] = decoded
  }
  return true
}

coercers.addKeyword('parser', {
  type: 'string',
  modifying: true,
  async: true,
  validate: codecCoerce,
})

/**
 * Get validation errors
 */
export function getErrorMessage(
  validator: Ajv.ValidateFunction,
  node: stencila.Node,
  errors: Ajv.ErrorObject[],
  format: 'cli' | 'js' = 'js'
): string {
  let details
  try {
    details = betterAjvErrors(validator.schema, node, errors, {
      format,
      indent: 2,
    })
  } catch {
    return errors
      .map((error) => `${error.dataPath}: ${error.message}`)
      .join('\n')
  }
  if (format === 'js') {
    return ((details as unknown) as betterAjvErrors.IOutputError[])
      .map((error) => `${error.error}`)
      .join(';')
  } else {
    return (details as unknown) as string
  }
}
