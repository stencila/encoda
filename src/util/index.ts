/**
 * @module util
 */

// TODO: This file uses any a lot. Needs a refactor and re-enable linting
/* eslint-disable
      @typescript-eslint/no-explicit-any,
      @typescript-eslint/explicit-function-return-type,
      @typescript-eslint/no-use-before-define
*/

import * as stencila from '@stencila/schema'
import Ajv from 'ajv'
import betterAjvErrors from 'better-ajv-errors'
import { record } from 'fp-ts'
import { eqString } from 'fp-ts/lib/Eq'
import { pipe } from 'fp-ts/lib/pipeable'
import fs from 'fs-extra'
import produce from 'immer'
import path from 'path'
import { decode as decodePerson } from '../codecs/person'
import type from './type'

/**
 * Create a node of a type
 * @param type The name of the type
 * @param initial Initial values for properties
 * @param validation What validation should done?
 */
export async function create<Key extends keyof stencila.Types>(
  type: Key,
  initial: { [key: string]: any } = {},
  validation: 'none' | 'validate' | 'coerce' = 'validate'
): Promise<stencila.Types[Key]> {
  let node = { type, ...initial }
  if (validation === 'validate') return validate(node, type)
  else if (validation === 'coerce') return coerce(node, type)
  else return node
}

/**
 * Cast a node to a particular type
 *
 * The node is validated against the type.
 * This means that an error will be throw if during:
 *   - up-casting the node does not have properties
 *     that are required by the schema of the new type
 *   - down-casting the node has properties that
 *     are additional to those in the schema of the new type
 * Use `coerce` if you want to ignore such errors
 * and force mutating the node to the type.
 *
 * @param node The node to cast
 * @param type The type to cast to
 */
export async function cast<Key extends keyof stencila.Types>(
  node: any,
  type: Key
): Promise<stencila.Types[Key]> {
  return produce(node, async (casted: any) => {
    casted.type = type
    await validate(casted, type)
  })
}

// Cached JSON Schema validation functions
const validators = new Ajv({
  jsonPointers: true,
  loadSchema
})

/**
 * Load a JSON Schema based on its URI
 */
async function loadSchema(uri: string) {
  const match = uri.match(/([\w]+)\.schema\.json$/)
  if (match) return readSchema(match[1])
  throw new Error(`Can not resolve schema "${uri}"`)
}

const schemasPath = path.dirname(require.resolve('@stencila/schema'))

/**
 * Read a JSON Schema file from `@stencila/schema`
 */
async function readSchema<Key extends keyof stencila.Types>(type: Key) {
  try {
    return await fs.readJSON(path.join(schemasPath, `${type}.schema.json`))
  } catch (error) {
    if (error.code === 'ENOENT')
      throw new Error(`No schema for type "${type}".`)
    throw error
  }
}

/**
 * Get the `Ajv` validation function for a type
 */
async function getValidator<Key extends keyof stencila.Types>(
  ajv: Ajv.Ajv,
  type: Key
): Promise<Ajv.ValidateFunction> {
  let validator = ajv.getSchema(
    `https://stencila.github.com/schema/${type}.schema.json`
  )
  if (!validator) {
    const schema = await readSchema(type)
    validator = await ajv.compileAsync(schema)
  }
  return validator
}

/**
 * Get the `Schema` object for a type
 */
async function getSchema<Key extends keyof stencila.Types>(
  ajv: Ajv.Ajv,
  type: Key
): Promise<any> {
  const validator = await getValidator(ajv, type)
  const schema = validator.schema
  if (schema === undefined || typeof schema === 'boolean')
    throw new Error(`Woaah! No schema on validator for type "${type}".`)
  return schema
}

/**
 * Validate a node against a type's schema
 * @param node The node to validate
 * @param type The type to validate against
 */
export async function validate<Key extends keyof stencila.Types>(
  node: any,
  typeName?: Key
): Promise<stencila.Types[Key]> {
  if (typeName === undefined) typeName = type(node) as Key
  const validator = await getValidator(validators, typeName)
  if (!validator(node)) {
    const errors = (betterAjvErrors(validator.schema, node, validator.errors, {
      format: 'js'
    }) as unknown) as betterAjvErrors.IOutputError[]
    throw new Error(errors.map(error => `${error.error}`).join(';'))
  }
  return node
}

/**
 * Is a node valid with respect to a particular type's schema
 * @param node The node to check
 * @param type The type to check against
 */
export async function valid<Key extends keyof stencila.Types>(
  node: any,
  type: Key
): Promise<boolean> {
  try {
    await validate(node, type)
    return true
  } catch (error) {
    return false
  }
}

// Cached JSON Schema validation/mutation functions
// These use Ajv options that coerce nodes so we
// keep them separate from pure non-mutating validators.
const mutators = new Ajv({
  jsonPointers: true,
  // Add values from `default` keyword when property is missing
  useDefaults: true,
  // Remove any additional properties
  removeAdditional: true,
  // Coerce type of data to match type keyword and coerce scalar
  // data to an array with one element and vice versa, as needed.
  coerceTypes: 'array',
  loadSchema
})

/**
 * A list of codecs that can be applied using the `codec` keyword
 *
 * TODO: Make these actual codecs (i.e. conforming to the `Codec`
 * interface with a `decode` async function)
 */
const codecs: { [key: string]: (data: string) => any } = {
  csv,
  ssv,
  person: decodePerson
}

/**
 * Decode comma separated string data into an array of strings
 */
function csv(data: string): string[] {
  return data.split(',')
}

/**
 * Decode space separated string data into an array of strings
 */
function ssv(data: string): string[] {
  return data.split(/ +/)
}

/**
 * Custom validation function that handles the `codec`
 * keyword.
 */
const codecValidate: Ajv.SchemaValidateFunction = (
  codec: string,
  data: string,
  parentSchema?: object,
  dataPath?: string,
  parentData?: object | any[],
  parentDataProperty?: string | number
  // rootData?: object | any[]
): boolean => {
  function raise(msg: string) {
    codecValidate.errors = [
      {
        keyword: 'decoding',
        dataPath: dataPath || '',
        schemaPath: '',
        params: {
          keyword: 'codec'
        },
        message: msg,
        data: data
      }
    ]
    return false
  }
  const decode = codecs[codec]
  if (!decode) return raise(`no such codec: "${codec}"`)

  let decoded: any
  try {
    decoded = decode(data)
  } catch (error) {
    const decodeError = error.message.split('\n')[0]
    return raise(`error using "${codec}" codec: ${decodeError}`)
  }

  if (parentData !== undefined && parentDataProperty !== undefined) {
    ;(parentData as any)[parentDataProperty] = decoded
  }
  return true
}

mutators.addKeyword('codec', {
  type: 'string',
  modifying: true,
  validate: codecValidate
})

/**
 * Coerce a node so it conforms to a type's schema
 *
 * @param node The node to coerce
 * @param typeName The type to coerce it to
 */
export async function coerce<Key extends keyof stencila.Types>(
  node: any,
  typeName?: Key
): Promise<stencila.Types[Key]> {
  if (typeName === undefined) typeName = type(node) as Key
  const mutator = await getValidator(mutators, typeName)

  return produce(node, async (coerced: any) => {
    if (typeof coerced === 'object') coerced.type = typeName
    // Rename property aliases
    await rename(coerced)
    // coerce and validate
    if (!mutator(coerced)) {
      const errors = (betterAjvErrors(mutator.schema, node, mutator.errors, {
        format: 'js'
      }) as unknown) as betterAjvErrors.IOutputError[]
      throw new Error(errors.map(error => `${error.error}`).join(';'))
    }
  })
  // Replace aliases with canonical names
  async function rename(node: any) {
    if (!node || typeof node !== 'object') return
    if (!node.type) return
    const schema = await getSchema(mutators, node.type as Key)
    if (!schema.propertyAliases) return

    for (let [key, child] of Object.entries(node)) {
      if (!Array.isArray(node)) {
        const name = schema.propertyAliases[key]
        if (name) {
          node[name] = child
          delete node[key]
        }
      }
      await rename(child)
    }
  }
}

/* Wrap non-`BlockContent` nodes in `Paragraph` nodes to conform to schema */
export const wrapInBlockNode = (node: stencila.Node): stencila.BlockContent => {
  return isBlockContent(node)
    ? node
    : { type: 'Paragraph', content: [node].filter(isInlineContent) }
}

export const hasType = (node?: stencila.Node): node is stencila.Thing => {
  if (!node) return false
  if (Array.isArray(node)) return false
  if (typeof node !== 'object') return false
  if (!node.type) return false
  return true
}

export const isNodeType = <Ts extends { type: string }>(
  typeMap: { [key in Ts['type']]: key }
) => (nodeType: string): boolean => {
  return pipe(record.elem(eqString)(nodeType, typeMap))
}

type NodeType = { type: string } & { [key: string]: unknown }

const hasTypeProp = (o: { type?: string }): o is NodeType => !!o.type

export const isNode = <T extends object, Ts extends NodeType = NodeType>(
  typeMap: { [key in Ts['type']]: key }
) => (n: unknown): n is T => {
  if (!n) return false
  if (Array.isArray(n)) return false
  if (typeof n !== 'object') return false
  if (n === null) return false
  return !hasTypeProp(n) ? false : isNodeType<Ts>(typeMap)(n.type)
}

export const blockContentTypes: {
  [key in stencila.BlockContent['type']]: key
} = {
  CodeBlock: 'CodeBlock',
  CodeChunk: 'CodeChunk',
  Heading: 'Heading',
  List: 'List',
  ListItem: 'ListItem',
  Paragraph: 'Paragraph',
  QuoteBlock: 'QuoteBlock',
  Table: 'Table',
  ThematicBreak: 'ThematicBreak'
}

export const isBlockContent = isNode<stencila.BlockContent>(blockContentTypes)

type InlineNodesWithType = Exclude<
  stencila.InlineContent,
  string | null | boolean | number
>['type']

export const inlineContentTypes: { [key in InlineNodesWithType]: key } = {
  Code: 'Code',
  CodeBlock: 'CodeBlock',
  CodeExpr: 'CodeExpr',
  Delete: 'Delete',
  Emphasis: 'Emphasis',
  ImageObject: 'ImageObject',
  Link: 'Link',
  Quote: 'Quote',
  Strong: 'Strong',
  Subscript: 'Subscript',
  Superscript: 'Superscript'
}

// null | boolean | string | number
export const isInlinePrimitive = (
  node: stencila.Node
): node is null | boolean | number | string => {
  if (node === undefined) return false
  if (node === null) return true
  if (typeof node === 'boolean') return true
  if (typeof node === 'number') return true
  if (typeof node === 'string') return true
  return false
}

export const isInlineNonPrimitive = (
  node: stencila.Node
): node is InlineNodesWithType => {
  if (isInlinePrimitive(node)) return false
  if (Array.isArray(node)) return false
  if (typeof node === 'object' && hasTypeProp(node))
    return isNodeType(inlineContentTypes)(node.type)
  return false
}

export const isInlineContent = (
  node: stencila.Node
): node is stencila.InlineContent => {
  return isInlinePrimitive(node) || isInlineNonPrimitive(node)
}

export const creativeWorkTypes: {
  [key in stencila.CreativeWork['type']]: key
} = {
  CreativeWork: 'CreativeWork',
  Article: 'Article',
  AudioObject: 'AudioObject',
  CodeChunk: 'CodeChunk',
  CodeExpr: 'CodeExpr',
  Collection: 'Collection',
  Datatable: 'Datatable',
  ImageObject: 'ImageObject',
  MediaObject: 'MediaObject',
  SoftwareApplication: 'SoftwareApplication',
  SoftwareSourceCode: 'SoftwareSourceCode',
  Table: 'Table',
  VideoObject: 'VideoObject'
}

export const isCreativeWork = isNode<stencila.CreativeWork>(creativeWorkTypes)
