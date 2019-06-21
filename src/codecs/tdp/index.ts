/**
 * Codec for Tabular Data Package (TDP)
 *
 * The [TDP specification](https://specs.frictionlessdata.io/tabular-data-package/)
 * is a [Data Package](https://specs.frictionlessdata.io/data-package/) (represented by a
 * `datapackage.json` file) that has:
 *
 *  - at least one resource in the resources array
 *  - each resource must be a (Tabular Data Resource)[https://specs.frictionlessdata.io/tabular-data-resource/] (TDR)
 *
 * The TDR can be either:
 *
 * - inline "JSON tabular data" that is array of data rows where each row is an array or object"
 * - a CSV file
 */

import { getLogger } from '@stencila/logga'
import stencila from '@stencila/schema'
// @ts-ignore
import datapackage from 'datapackage'
import { Encode, EncodeOptions } from '.'
import * as csv from './csv'
import { create, dump, load, VFile } from './vfile'

const logger = getLogger('encoda')

export const mediaTypes = [
  // As registered at https://www.iana.org/assignments/media-types/media-types.xhtml
  'application/vnd.datapackage+json'
]

export const fileNames = ['datapackage.json']

export const extNames = [
  // To be able to refer to this codec since the `mime` package
  // does not have registered extension names for the above media type
  'tdp'
]

export async function decode(file: VFile): Promise<stencila.Node> {
  let pkg: datapackage.Package
  if (file.path) pkg = await datapackage.Package.load(file.path)
  else pkg = await datapackage.Package.load(JSON.parse(await dump(file)))

  // Decode resources
  const parts = await Promise.all(pkg.resources.map(
    async (resource: datapackage.Resource) => decodeResource(resource)
  ) as Array<Promise<stencila.Datatable>>)

  // Collection or Datatable ?
  let node: stencila.Datatable | stencila.Collection
  if (parts.length === 1) node = parts[0]
  else node = { type: 'Collection', parts }

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

export const encode: Encode = async (
  node: stencila.Node,
  { filePath }: EncodeOptions = {}
): Promise<VFile> => {
  let cw = node as stencila.CreativeWork

  // Create a package descriptor from meta-data
  const desc: { [key: string]: any } = {
    profile: 'tabular-data-package',
    // Name is the only required property
    name: cw.name || 'Unnamed'
  }
  const title = cw.alternateNames && cw.alternateNames[0]
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
        const title = license.alternateNames && license.alternateNames[0]
        if (title) object.title = title
        return object
      }
    )
  }

  // Encode Datatable into resource descriptors
  const resources: Array<datapackage.Resource> = []
  if (cw.type === 'Collection') {
    const collection = cw as stencila.Collection
    if (collection.parts) {
      for (let part of collection.parts) {
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
    resources.map(async resource => (await resource).descriptor)
  )

  const pkg = await datapackage.Package.load(desc, undefined, true)

  if (filePath) {
    // Save the package (datapackage.json and all resource files) and return an empty VFile
    pkg.save(filePath)
    return create()
  } else {
    // Return a VFile with the JSON of datapackage.json
    const json = JSON.stringify(pkg.descriptor, null, '  ')
    return load(json)
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
  let data: Array<any>
  try {
    data = await resource.read()
  } catch (error) {
    if (error.multiple) {
      for (const err of error.errors) logger.error(err)
    }
    throw error
  }

  // Transform row-wise data into column-wise
  const values: Array<any> = Array(resource.schema.fields.length)
    .fill(null)
    .map(item => Array())
  for (let row of data) {
    let index = 0
    for (let value of row) {
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
    fields: datatable.columns.map(encodeDatatableColumn)
  }
  const desc = {
    profile: 'tabular-data-resource',
    name: datatable.name || 'Unnamed',

    data: await dump(await csv.encode(datatable)),
    format: 'csv',
    mediatype: 'text/csv',
    encoding: 'utf-8',

    schema
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
  values: Array<any>
): stencila.DatatableColumn {
  // Decode constraints
  let constraints = field.constraints || {}
  let items = decodeFieldConstraints(constraints)

  // Decode `type` and `format`. From the Table Schema docs:
  //   Both type and format are optional: in a field descriptor, the absence of a type
  //   property indicates that the field is of the type "string", and the absence of a
  //   format property indicates that the field's type format is "default".
  let { type, format } = decodeFieldTypeFormat(
    field.type || 'string',
    field.format || 'default'
  )
  if (type) {
    const itemsSchema = (items.anyOf && items.anyOf[0]) || items
    itemsSchema.type = type
    if (type === 'string' && format) {
      itemsSchema.format = format
    }
  }

  // Build the column schema
  const schema: stencila.DatatableColumnSchema = {
    type: 'DatatableColumnSchema',
    items
  }
  if (constraints.unique) schema.uniqueItems = true

  return {
    type: 'DatatableColumn',
    name: field.name,
    schema,
    values
  }
}

/**
 * Encode a `stencila.DatatableColumn` to a Table Schema [`Field`](https://github.com/frictionlessdata/tableschema-js#field)
 */
function encodeDatatableColumn(
  column: stencila.DatatableColumn
): datapackage.Field {
  const field = {
    name: column.name
  }
  if (!column.schema) return field

  let { type, format, constraints } = encodeDatatableColumnSchema(column.schema)
  if (column.schema.uniqueItems) constraints.unique = true

  return { ...field, type, format, constraints }
}

/********************************************************************
 *  Field type, etc <-> DatatableColumnSchema
 ********************************************************************/

/**
 * Decode a Frictionless Data Table Schema [types and formats](https://frictionlessdata.io/specs/table-schema/#types-and-formats)
 * to JSON Schema [`type`](https://json-schema.org/understanding-json-schema/reference/type.html)
 * and [`format`](https://json-schema.org/understanding-json-schema/reference/string.html#format).
 */
export function decodeFieldTypeFormat(
  type: null | string,
  format: null | string
) {
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
export function decodeFieldConstraints(constraints: { [key: string]: any }) {
  let items: { [key: string]: any } = {}
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
      anyOf: [items, { type: 'null' }]
    }
  }
}

function encodeDatatableColumnSchema(schema: stencila.DatatableColumnSchema) {
  let items = schema.items

  const constraints: { [key: string]: any } = {}
  if (items.anyOf) {
    items = items.anyOf[0] as { [key: string]: any }
  } else {
    constraints.required = true
  }

  let type = items.type
  let format = items.format
  switch (type) {
    case 'boolean':
    case 'integer':
    case 'number':
    case 'object':
    case 'array':
      break

    case 'string':
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

    default:
      type = 'any'
  }

  if (items.minimum) constraints.minimum = items.minimum
  if (items.maximum) constraints.maximum = items.maximum
  if (items.minLength) constraints.minLength = items.minLength
  if (items.maxLength) constraints.maxLength = items.maxLength
  if (items.pattern) constraints.pattern = items.pattern
  if (items.enum) constraints.enum = items.enum

  return { type, format, constraints }
}
