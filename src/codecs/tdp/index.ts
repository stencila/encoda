/**
 * @module tdp
 */

/**
 * Hello contributor 👋! If you are working on this file, please
 * endeavor to remove the need for the following `eslint-disable` line 🙏.
 * Remove the line and run `npx eslint path/to/this/file.ts` to
 * see which code needs some linting ❤️.
 * See https://github.com/stencila/encoda/issues/199 for suggestions
 * on how to refactor code to avoid non-strict boolean expressions.
 */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */

import { getLogger } from '@stencila/logga'
import * as stencila from '@stencila/schema'
// @ts-ignore
import datapackage from 'datapackage'
import { dump } from '../..'
import * as vfile from '../../util/vfile'
import { Codec, CommonEncodeOptions } from '../types'

const logger = getLogger('encoda')

export class TDPCodec extends Codec implements Codec {
  public readonly mediaTypes = [
    // As registered at https://www.iana.org/assignments/media-types/media-types.xhtml
    'application/vnd.datapackage+json',
  ]

  public readonly fileNames = ['datapackage.json']

  public readonly extNames = [
    // To be able to refer to this codec since the `mime` package
    // does not have registered extension names for the above media type
    'tdp',
  ]

  public readonly decode = async (
    file: vfile.VFile
    // eslint-disable-next-line @typescript-eslint/require-await
  ): Promise<stencila.Node> => {
    let pkg: datapackage.Package
    if (file.path) {
      pkg = await datapackage.Package.load(file.path)
    } else {
      pkg = await datapackage.Package.load(JSON.parse(await vfile.dump(file)))
    }

    // Decode resources
    const parts = await Promise.all(
      pkg.resources.map(async (resource: datapackage.Resource) =>
        decodeResource(resource)
      ) as Promise<stencila.Datatable>[]
    )

    // Collection or Datatable ?
    let node: stencila.Datatable | stencila.Collection
    if (parts.length === 1) {
      node = parts[0]
    } else {
      node = { type: 'Collection', parts }
    }

    // Add metadata https://frictionlessdata.io/specs/data-resource/#metadata-properties
    const desc = pkg.descriptor
    if (desc.name) node.name = desc.name
    if (desc.title) node.alternateNames = [desc.title as string]
    if (desc.description) node.description = desc.description
    if (desc.licenses) {
      // Convert a https://frictionlessdata.io/specs/data-package/#licenses
      // to a https://schema.org/license property
      node.licenses = desc.licenses.map((object: any) => {
        const license: stencila.CreativeWork = { type: 'CreativeWork' }
        if (object.name) license.name = object.name
        if (object.path) license.url = object.path
        if (object.title) license.alternateNames = [object.title]
        return license
      })
    }

    return node
  }

  public readonly encode = async (
    node: stencila.Node,
    { filePath }: CommonEncodeOptions = this.commonEncodeDefaults
  ): Promise<vfile.VFile> => {
    const cw = node as stencila.CreativeWork

    // Create a package descriptor from meta-data
    const desc: { [key: string]: any } = {
      profile: 'tabular-data-package',
      // Name is the only required property
      name: cw.name ?? 'Unnamed',
    }
    const title = cw.alternateNames?.[0]
    if (title) desc.title = title
    if (cw.description) desc.description = cw.description
    if (cw.licenses) {
      desc.licenses = cw.licenses.map(
        (license: string | stencila.CreativeWork) => {
          if (typeof license === 'string') {
            // Since name is required...
            return { name: license }
          }
          const object: { [key: string]: any } = {}
          if (license.name) object.name = license.name
          if (license.url) object.path = license.url
          const title = license.alternateNames?.[0]
          if (title) object.title = title
          return object
        }
      )
    }

    // Encode Datatable into resource descriptors
    const resources: datapackage.Resource[] = []
    if (cw.type === 'Collection') {
      const collection = cw as stencila.Collection
      if (collection.parts) {
        for (const part of collection.parts) {
          if (part.type !== 'Datatable') {
            throw new Error(
              `Unable to convert collection part of type ${part.type}`
            )
          }
          resources.push(encodeCreativeWork(part))
        }
      }
    } else {
      resources.push(encodeCreativeWork(cw))
    }
    desc.resources = await Promise.all(
      resources.map(async (resource) => (await resource).descriptor)
    )

    const pkg = await datapackage.Package.load(desc, undefined, true)

    if (filePath) {
      // Save the package (datapackage.json and all resource files) and return an empty VFile
      pkg.save(filePath)
      return vfile.create()
    } else {
      // Return a VFile with the JSON of datapackage.json
      const json = JSON.stringify(pkg.descriptor, null, '  ')
      return vfile.load(json)
    }
  }
}

/********************************************************************
 *  datapackage.Resource <-> stencila.Datatable
 ********************************************************************/

/**
 * Decode a [`datapackage.Resource`](https://frictionlessdata.io/specs/data-resource/)
 * to a `stencila.Datatable`.
 *
 * @param datatable The datatable to encode
 * @returns A resource
 */
async function decodeResource(
  resource: datapackage.Resource
): Promise<stencila.Datatable> {
  // Read in the data
  let data: any[]
  try {
    data = await resource.read()
  } catch (error) {
    if (error.multiple) {
      for (const err of error.errors) logger.error(err)
    }
    throw error
  }

  // Transform row-wise data into column-wise
  const values: any[] = Array(resource.schema.fields.length)
    .fill(null)
    .map(() => [])
  for (const row of data) {
    let index = 0
    for (const value of row) {
      values[index].push(value)
      index += 1
    }
  }

  // Decode fields
  const columns = resource.schema.fields.map((field: any, index: number) =>
    decodeField(field, values[index])
  )

  return { type: 'Datatable', columns }
}

/**
 * Encode a `stencila.CreativeWork` to a [`datapackage.Resource`](https://frictionlessdata.io/specs/data-resource/)
 *
 * The data is inlined as CSV allowing the resource to be saved to file later.
 *
 * @param datatable The datatable to encode
 * @returns A resource
 */
async function encodeCreativeWork(
  cw: stencila.CreativeWork
): datapackage.Resource {
  const datatable = cw as stencila.Datatable

  const schema = {
    fields: datatable.columns.map(encodeDatatableColumn),
  }
  const desc = {
    profile: 'tabular-data-resource',
    name: datatable.name ?? 'Unnamed',

    data: await dump(datatable, 'csv'),
    format: 'csv',
    mediatype: 'text/csv',
    encoding: 'utf-8',

    schema,
  }
  return datapackage.Resource.load(desc, undefined, true)
}

/********************************************************************
 *  Field <-> DatatableColumn
 ********************************************************************/

/**
 * Decode a Table Schema [`Field`](https://github.com/frictionlessdata/tableschema-js#field) to a `stencila.DatatableColumn`.
 */
function decodeField(
  field: datapackage.Field,
  values: any[]
): stencila.DatatableColumn {
  // Decode constraints
  const constraints = field.constraints || {}
  const items = decodeFieldConstraints(constraints)

  // Decode `type` and `format`. From the Table Schema docs:
  //   Both type and format are optional: in a field descriptor, the absence of a type
  //   property indicates that the field is of the type "string", and the absence of a
  //   format property indicates that the field's type format is "default".
  const { type, format } = decodeFieldTypeFormat(
    field.type || 'string',
    field.format || 'default'
  )
  if (type) {
    const itemsSchema = items.anyOf?.[0] || items
    itemsSchema.type = type
    if (type === 'string' && format) {
      itemsSchema.format = format
    }
  }

  // Build the column validator
  const validator = stencila.arrayValidator(items)
  if (constraints.unique) validator.uniqueItems = true

  return stencila.datatableColumn({ name: field.name, values, validator })
}

/**
 * Encode a `stencila.DatatableColumn` to a Table Schema [`Field`](https://github.com/frictionlessdata/tableschema-js#field)
 */
function encodeDatatableColumn(
  column: stencila.DatatableColumn
): datapackage.Field {
  const { name, validator } = column
  const field = { name }
  if (!validator) return field

  const { type, format, constraints } = encodeDatatableColumnValidator(
    validator
  )
  if (validator.uniqueItems) constraints.unique = true

  return { ...field, type, format, constraints }
}

/********************************************************************
 *  Field type, etc <-> DatatableColumnSchema
 ********************************************************************/

interface TypeFormatPattern {
  type: string | null
  format: string | null
  pattern: string | null
}

/**
 * Decode a Frictionless Data Table Schema [types and formats](https://frictionlessdata.io/specs/table-schema/#types-and-formats)
 * to JSON Schema [`type`](https://json-schema.org/understanding-json-schema/reference/type.html)
 * and [`format`](https://json-schema.org/understanding-json-schema/reference/string.html#format).
 */
export function decodeFieldTypeFormat(
  type: null | string,
  format: null | string
): TypeFormatPattern {
  // Translate the type and format to valid JSON Schema type, format and pattern, combinations
  let pattern: null | string = null
  switch (type) {
    // Types for which no translation is necessary and format
    // does not apply
    case 'boolean':
    case 'integer':
    case 'number':
    case 'string':
    case 'object':
    case 'array':
      format = null
      break

    // Types which are represented as a string with a format
    case 'date':
      type = 'string'
      format = 'date'
      break
    case 'time':
      type = 'string'
      format = 'time'
      break
    case 'datetime':
      type = 'string'
      format = 'date-time'
      break

    // Types which are represented as represented as
    // a string with a pattern (because format is not defined yet)
    case 'year':
      type = 'string'
      format = 'year'
      pattern = '^[0-9]{4}$'
      break
    case 'yearmonth':
      type = 'string'
      format = 'yearmonth'
      pattern = '^[0-9]{4}-[0-9]{2}$'
      break

    // If 'any', then there is no constraint on the type of items
    case 'any':
      type = null
      break

    default:
      throw new Error(`Unhandled type "${type}"`)
  }
  return { type, format, pattern }
}

/**
 * Decode a Frictionless Data Table Schema [constraints](https://frictionlessdata.io/specs/table-schema/#constraints) to
 * JSON Schema keywords such as `minimum`.
 *
 * Note that the the `unique` constraints are handled elsewhere. Only constraints that
 * apply to items should be returned here.
 */
export function decodeFieldConstraints(constraints: {
  [key: string]: any
}): { [key: string]: any } {
  const items: { [key: string]: any } = {}
  if (constraints.minimum) items.minimum = constraints.minimum
  if (constraints.maximum) items.maximum = constraints.maximum
  if (constraints.minLength) items.minLength = constraints.minLength
  if (constraints.maxLength) items.maxLength = constraints.maxLength
  if (constraints.pattern) items.pattern = constraints.pattern
  if (constraints.enum) items.enum = constraints.enum

  if (constraints.required) {
    return items
  } else {
    // If not required, then allow for null values
    return {
      anyOf: [items, { type: 'null' }],
    }
  }
}

interface ColumnTypeFormatConstraints {
  type: any
  format: any
  constraints: {
    [key: string]: any
  }
}

function encodeDatatableColumnValidator(
  schema: stencila.ArrayValidator
): ColumnTypeFormatConstraints {
  // TODO: this method needs checking and refactoring since changing to
  //  ArraySchema
  const items = schema.itemsValidator

  if (items === undefined)
    return {
      type: undefined,
      format: undefined,
      constraints: {},
    }

  const constraints: { [key: string]: any } = {}

  constraints.required = schema.minItems !== undefined && schema.minItems > 0

  let type
  let format
  switch (stencila.nodeType(items)) {
    case 'ConstantValidator':
      type = 'object'
      break
    case 'BooleanValidator':
      type = 'boolean'
      break
    case 'NumberValidator':
      type = 'number'
      break
    case 'IntegerValidator':
      type = 'integer'
      break
    case 'StringValidator': {
      const stringValidator = items as stencila.StringValidator
      if (stringValidator.minLength)
        constraints.minLength = stringValidator.minLength
      if (stringValidator.maxLength)
        constraints.maxLength = stringValidator.maxLength
      if (stringValidator.pattern) constraints.pattern = stringValidator.pattern

      type = 'string'

      format = stringValidator.pattern

      switch (format) {
        case 'date':
          type = 'date'
          break
        case 'time':
          type = 'time'
          break
        case 'date-time':
          type = 'datetime'
          break
      }
      break
    }
    case 'EnumValidator': {
      const enumValidator = items as stencila.EnumValidator
      if (enumValidator.values) constraints.enum = enumValidator.values
      type = 'string'
      break
    }
    case 'ArrayValidator':
      type = 'array'
      break
    case 'TupleValidator':
      type = 'array'
      break
    default:
      type = 'any'
  }

  if (schema.minItems) constraints.minimum = schema.minItems
  if (schema.maxItems) constraints.maximum = schema.maxItems

  return { type, format, constraints }
}
