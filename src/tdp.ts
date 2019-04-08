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

export const mediaTypes = []

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
    const columns: Array<any> = Array(resource.schema.fields.length)
      .fill(null)
      .map(item => Array())
    for (let row of data) {
      let index = 0
      for (let value of row) {
        columns[index].push(value)
        index += 1
      }
    }

    const datatable: stencila.Datatable = {
      type: 'Datatable',
      columns: resource.schema.fields.map((field: any, index: number) =>
        parseField(field, columns[index])
      )
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

// Fields https://github.com/frictionlessdata/tableschema-js#field <-> DatatableColumn

function parseField(field: any, values: Array<any>): stencila.DatatableColumn {
  const schema: stencila.CoreSchemaMetaSchema = {
    type: field.type
  }
  const constraints = field.constraints
  if (constraints) {
    if (constraints.minimum) schema.minimum = constraints.minimum
    if (constraints.maximum) schema.maximum = constraints.maximum
    if (constraints.minLength) schema.minLength = constraints.minLength
    if (constraints.maxLength) schema.maxLength = constraints.maxLength
    if (constraints.pattern) schema.pattern = constraints.pattern
    if (constraints.enum) schema.enum = constraints.enum
  }
  return {
    type: 'DatatableColumn',
    name: field.name,
    schema,
    values
  }
}
