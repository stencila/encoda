/**
 * Compiler for Microsoft Excel.
 *
 * Also acts as base implementation for other spreadsheet-like formats
 * including `ods` and `csv`. Uses [`js-xlsx`]()`https://github.com/SheetJS/js-xlsx) to
 * parse and dump spreadsheets and transforms to/from the it's
 * (Common Spreadsheet Format)[https://github.com/SheetJS/js-xlsx#common-spreadsheet-format]
 * and Stencila schema instances.
 */

import stencila from '@stencila/schema'
import * as xlsx from 'xlsx'
import { load, VFile } from './vfile'

export const mediaTypes = [
  // spell-checker: disable
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  // spell-checker: enable
]

export async function parse(file: VFile): Promise<stencila.Node> {
  let workbook = xlsx.read(file.contents, {
    type: 'buffer'
  })
  return parseWorkbook(workbook)
}

export async function unparse(
  node: stencila.Node,
  filePath?: string,
  format: string = 'xlsx'
): Promise<VFile> {
  const workbook = unparseNode(node)
  const buffer = xlsx.write(workbook, {
    type: 'buffer',
    bookType: format as xlsx.BookType
  })
  return load(buffer)
}

/**
 *
 * @param workbook The workbook to parse
 */
function parseWorkbook(
  workbook: xlsx.WorkBook
): stencila.Table | stencila.Datatable | stencila.Collection {
  const parts: Array<stencila.Table | stencila.Datatable> = []
  for (let name of workbook.SheetNames) {
    let sheet = workbook.Sheets[name]

    // Parse all cells and if any have a formula, comments etc, then
    // treat this sheet as a Table
    let dataOnly = true
    let cells: any = {}
    for (let [key, cell] of Object.entries(sheet)) {
      if (key.startsWith('!')) continue
      if (cell.f) dataOnly = false
      cells[key] = parseCell(cell)
    }

    // Create a part for this sheet
    let part
    if (dataOnly) {
      // Create a `Datatable`
      // Convert the list of cells to a list of columns with values
      const columns: Array<any> = []
      for (let [key, cell] of Object.entries(cells)) {
        const match = key.match(/^([A-Z]+)([1-9][0-9]*)$/)
        if (!match) throw new Error(`Unexpected cell key ${key}`)

        const column = columnNameToIndex(match[1])
        const row = parseInt(match[2], 10) - 1

        let values = columns[column]
        if (!values) {
          values = []
          columns[column] = values
        }
        values[row] = cell
      }
      // If the first value in each column is a string then
      // treat them as names (and thus remove them from) the
      // values. Otherwise, use automatic, alphabetic names.
      let names: Array<string | undefined> = []
      for (const column of columns) {
        if (typeof column[0] === 'string') {
          names.push(column[0])
        } else {
          break
        }
      }
      if (names.length === columns.length) {
        for (const column of columns) {
          column.shift()
        }
      } else {
        names = columns.map((column, index) => columnIndexToName(index))
      }

      const datatable: stencila.Datatable = {
        type: 'Datatable',
        columns: columns.map(function(column, index): stencila.DatatableColumn {
          return {
            type: 'DatatableColumn',
            name: names[index],
            values: column
          }
        })
      }
      part = datatable
    } else {
      const table: stencila.Table = {
        type: 'Table',
        cells: cells
      }
      part = table
    }

    // If this is the only sheet then simply return the
    // part, otherwise add it to the list of parts.
    if (workbook.SheetNames.length === 1) return part
    else parts.push(part)
  }

  const collection: stencila.Collection = {
    type: 'Collection',
    parts
  }
  return collection
}

function parseCell(cell: xlsx.CellObject) {
  let value = cell.v
  if (value) {
    if (cell.t === 'd') {
      value = (value as Date).toISOString()
    }
  }

  if (cell.f) {
    const expression: stencila.Expression = {
      type: 'Expression',
      programmingLanguages: ['excel'],
      text: cell.f.trim()
    }
    if (value) expression.value = value
    return expression
  } else {
    return value
  }
}

/**
 * Convert a column index (e.g. `27`) into a name (e.g. `AA`)
 *
 * Thanks to https://stackoverflow.com/a/182924.
 *
 * @param index The column index
 */
export function columnIndexToName(index: number) {
  let name = ''
  let dividend = index + 1
  while (dividend > 0) {
    let modulo = (dividend - 1) % 26
    name = String.fromCharCode(65 + modulo) + name
    dividend = Math.floor((dividend - modulo) / 26)
  }
  return name
}

/**
 * Convert a column name (e.g. `AA`) into letters (e.g. `27`)
 *
 * Thanks to https://stackoverflow.com/a/46173864.
 *
 * @param index The column index
 */
export function columnNameToIndex(letters: string) {
  let index = 0
  for (let position = 0; position < letters.length; position++) {
    index = letters[position].charCodeAt(0) - 64 + index * 26
  }
  return index - 1
}

function unparseNode(node: stencila.Node): xlsx.WorkBook {
  if (!node || typeof node !== 'object' || !node.hasOwnProperty('type')) {
    throw new Error('Unable to unparse node')
  }
  const workbook: xlsx.WorkBook = {
    SheetNames: [],
    Sheets: {}
  }
  return workbook
}
