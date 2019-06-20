import * as stencila from '@stencila/schema'
import Ajv from 'ajv'
import betterAjvErrors from 'better-ajv-errors'
import { record } from 'fp-ts'
import { eqString } from 'fp-ts/lib/Eq'
import { pipe } from 'fp-ts/lib/pipeable'
import fs from 'fs-extra'
import globby from 'globby'
import produce from 'immer'
import path from 'path'
import { decode as decodePerson } from './person'
import type from './util/type'

const built = path.join(
  path.dirname(require.resolve('@stencila/schema')),
  'built'
)

// Load all schemas for use in by Ajv validator
const schemas = globby
  .sync(path.join(built, '*.schema.json'))
  .map(file => fs.readJSONSync(file))

// Read in aliases for use in coerce function
const aliases = fs.readJSONSync(path.join(built, 'aliases.json'))

/**
 * Create a node of a type
 * @param type The name of the type
 * @param initial Initial values for properties
 * @param validation What validation should done?
 */
export function create<Key extends keyof stencila.Types>(
  type: Key,
  initial: { [key: string]: any } = {},
  validation: 'none' | 'validate' | 'coerce' = 'validate'
): stencila.Types[Key] {
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
export function cast<Key extends keyof stencila.Types>(
  node: any,
  type: Key
): stencila.Types[Key] {
  return produce(node, (casted: any) => {
    casted.type = type
    validate(casted, type)
  })
}

// Cached JSON Schema validation functions
const validators = new Ajv({
  schemas,
  jsonPointers: true
})

/**
 * Validate a node against a type's schema
 * @param node The node to validate
 * @param type The type to validate against
 */
export function validate<Key extends keyof stencila.Types>(
  node: any,
  type: Key
): stencila.Types[Key] {
  const validator = validators.getSchema(
    `https://stencila.github.com/schema/${type}.schema.json`
  )
  if (!validator) throw new Error(`No schema for type "${type}".`)
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
export function valid<Key extends keyof stencila.Types>(
  node: any,
  type: Key
): boolean {
  try {
    validate(node, type)
    return true
  } catch (error) {
    return false
  }
}

// Cached JSON Schema validation/mutation functions
// These use Ajv options that coerce nodes so we
// keep them separate from pure non-mutating validators.
const mutators = new Ajv({
  schemas,
  jsonPointers: true,
  // Add values from `default` keyword when property is missing
  useDefaults: true,
  // Remove any additional properties
  removeAdditional: true,
  // Coerce type of data to match type keyword and coerce scalar
  // data to an array with one element and vice versa, as needed.
  coerceTypes: 'array'
})

/**
 * A list of decoders that can be applied using the `decoder` keyword
 */
const decoders: { [key: string]: (data: string) => any } = {
  csv,
  ssv,
  person: decodePerson
}

/**
 * Decode comma separated string data into an array of strings
 */
function csv(data: string): Array<string> {
  return data.split(',')
}

/**
 * Decode space separated string data into an array of strings
 */
function ssv(data: string): Array<string> {
  return data.split(/ +/)
}

/**
 * Custom validation function that handles the `decoder`
 * keyword.
 */
const decoderValidate: Ajv.SchemaValidateFunction = (
  decoder: string,
  data: string,
  parentSchema?: object,
  dataPath?: string,
  parentData?: object | Array<any>,
  parentDataProperty?: string | number,
  rootData?: object | Array<any>
): boolean => {
  function raise(msg: string) {
    decoderValidate.errors = [
      {
        keyword: 'parser',
        dataPath: '' + dataPath,
        schemaPath: '',
        params: {
          keyword: 'parser'
        },
        message: msg,
        data: data
      }
    ]
    return false
  }
  const decode = decoders[decoder]
  if (!decode) return raise(`no such decoder: "${decoder}"`)

  let decoded: any
  try {
    decoded = decode(data)
  } catch (error) {
    const decodeError = error.message.split('\n')[0]
    return raise(`error when decoding using "${decoder}": ${decodeError}`)
  }

  if (parentData !== undefined && parentDataProperty !== undefined) {
    ;(parentData as any)[parentDataProperty] = decoded
  }
  return true
}

mutators.addKeyword('parser', {
  type: 'string',
  modifying: true,
  validate: decoderValidate
})

/**
 * Coerce a node so it conforms to a type's schema
 *
 * @param node The node to coerce
 * @param typeName The type to coerce it to
 */
export function coerce<Key extends keyof stencila.Types>(
  node: any,
  typeName?: Key
): stencila.Types[Key] {
  if (!typeName) typeName = type(node) as Key

  const mutator = mutators.getSchema(
    `https://stencila.github.com/schema/${typeName}.schema.json`
  )
  if (!mutator) throw new Error(`No schema for type "${typeName}".`)

  return produce(node, (coerced: any) => {
    if (typeof coerced === 'object') coerced.type = typeName
    // Rename property aliases
    rename(coerced)
    // coerce and validate
    if (!mutator(coerced)) {
      const errors = (betterAjvErrors(mutator.schema, node, mutator.errors, {
        format: 'js'
      }) as unknown) as betterAjvErrors.IOutputError[]
      throw new Error(errors.map(error => `${error.error}`).join(';'))
    }
  })
  // Replace aliases with canonical names
  function rename(node: any) {
    if (!node || typeof node !== 'object') return
    if (!(node.type && aliases[node.type])) return

    let propertyAliases = aliases[node.type]
    for (let [key, child] of Object.entries(node)) {
      if (!Array.isArray(node)) {
        const name = propertyAliases[key]
        if (name) {
          node[name] = child
          delete node[key]
        }
      }
      rename(child)
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

const hasTypeProp = (o: { type?: string }): o is NodeType =>
  o.type ? true : false

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
  Strong: 'Strong'
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
