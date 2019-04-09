/**
 * Compiler for Tabular Data Package (TDP)
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

import stencila from '@stencila/schema'
// @ts-ignore
import datapackage from 'datapackage'
import path from 'path'
import * as csv from './csv'
import { dump, VFile } from './vfile'

export const mediaTypes = [
  // As registered at https://www.iana.org/assignments/media-types/media-types.xhtml
  'application/vnd.datapackage+json'
]

export const extensions = [
  // To be able to refer to this compiler since the `mime` package
  // does not have registered extension names for the above media type
  'tdp'
]

export async function sniff(filePath: string): Promise<boolean> {
  if (path.basename(filePath) === 'datapackage.json') return true
  return false
}

export async function parse(file: VFile): Promise<stencila.Node> {
  let pkg: datapackage.Package
  if (file.path) {
    pkg = await datapackage.Package.load(file.path)
  } else {
    pkg = await datapackage.Package.load(JSON.parse(dump(file)))
  }

  const parts: Array<stencila.Datatable> = []
  for (const resource of pkg.resources) {
    // Read in the data
    let data: Array<any>
    try {
      data = await resource.read()
    } catch (error) {
      if (error.multiple) {
        for (const err of error.errors) console.log(err)
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

    // Parse fields
    const columns = resource.schema.fields.map((field: any, index: number) =>
      parseField(field, values[index])
    )

    const datatable: stencila.Datatable = {
      type: 'Datatable',
      columns
    }
    if (pkg.resources.length === 1) return datatable
    else parts.push(datatable)
  }

  const collection: stencila.Collection = {
    type: 'Collection',
    parts
  }
  return collection
}

export async function unparse(node: stencila.Node): Promise<VFile> {
  return csv.unparse(node)
}

// Field <-> DatatableColumn

/**
 * Parse a Frictionless Data Table Schema [`Field`](https://github.com/frictionlessdata/tableschema-js#field)
 * into a `stencila.DatatableColumn`.
 */
function parseField(field: any, values: Array<any>) {
  // Parse constraints
  let constraints = field.constraints || {}
  let items = parseFieldConstraints(constraints)

  // Parse `type` and `format`. From the Table Schema docs:
  //   Both type and format are optional: in a field descriptor, the absence of a type
  //   property indicates that the field is of the type "string", and the absence of a
  //   format property indicates that the field's type format is "default".
  let { type, format } = parseFieldTypeFormat(
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
    items: items
  }
  if (constraints.unique) {
    schema.uniqueItems = true
  }

  const column: stencila.DatatableColumn = {
    type: 'DatatableColumn',
    name: field.name,
    schema,
    values
  }
  return column
}

/**
 * Parse a Frictionless Data Table Schema [types and formats](https://frictionlessdata.io/specs/table-schema/#types-and-formats)
 * to JSON Schema [`type`](https://json-schema.org/understanding-json-schema/reference/type.html)
 * and [`format`](https://json-schema.org/understanding-json-schema/reference/string.html#format).
 */
export function parseFieldTypeFormat(
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

    // Types which are represented as represented as
    // a string with a format
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
 * Parse a Frictionless Data Table Schema [constraints](https://frictionlessdata.io/specs/table-schema/#constraints) to
 * JSON Schema keywords such as `minimum`.
 *
 * Note that the the `unique` constraints are handled elsewhere. Only constraints that
 * apply to items should be returned here.
 */
export function parseFieldConstraints(constraints: { [key: string]: any }) {
  let schema: { [key: string]: any } = {}
  if (constraints.minimum) schema.minimum = constraints.minimum
  if (constraints.maximum) schema.maximum = constraints.maximum
  if (constraints.minLength) schema.minLength = constraints.minLength
  if (constraints.maxLength) schema.maxLength = constraints.maxLength
  if (constraints.pattern) schema.pattern = constraints.pattern
  if (constraints.enum) schema.enum = constraints.enum

  if (constraints.required) {
    return schema
  } else {
    // If not required, then allow for null values
    return {
      anyOf: [schema, { type: 'null' }]
    }
  }
}
