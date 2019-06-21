/**
 * Codec for Microsoft Excel.
 *
 * Also acts as base implementation for other spreadsheet-like formats
 * including `ods` and `csv`. Uses [`js-xlsx`]()`https://github.com/SheetJS/js-xlsx) to
 * decode and dump spreadsheets and transforms to/from the it's
 * (Common Spreadsheet Format)[https://github.com/SheetJS/js-xlsx#common-spreadsheet-format]
 * and Stencila schema instances.
 */

import stencila from '@stencila/schema'
import { array, option, ord } from 'fp-ts'
import { range } from 'fp-ts/lib/Array'
import { pipe } from 'fp-ts/lib/pipeable'
import * as xlsx from 'xlsx'
import { Encode, EncodeOptions } from '../..'
import type from '../../util/type'
import * as vfile from '../../util/vfile'

export const mediaTypes = [
  // spell-checker: disable
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  // spell-checker: enable
]

const cellNameRegEx = /^([A-Z]+)([1-9][0-9]*)$/

export async function decode(file: vfile.VFile): Promise<stencila.Node> {
  const buffer = await vfile.dump(file, 'buffer')
  let workbook = xlsx.read(buffer, { type: 'buffer' })
  return decodeWorkbook(workbook)
}

export const encode: Encode = async (
  node: stencila.Node,
  { format = 'xlsx' }: EncodeOptions = {}
): Promise<vfile.VFile> => {
  const workbook = encodeNode(node)
  const buffer = xlsx.write(workbook, {
    type: format === 'csv' ? 'string' : 'buffer',
    bookType: format as xlsx.BookType
  })
  return vfile.load(buffer)
}

// WorkBook <-> Node

function decodeWorkbook(
  workbook: xlsx.WorkBook
): stencila.Table | stencila.Datatable | stencila.Collection {
  const parts: Array<stencila.Table | stencila.Datatable> = []
  for (let name of workbook.SheetNames) {
    const sheet = workbook.Sheets[name]

    // Decode all cells and if any have a formula, comments etc, then
    // treat this sheet as a Table
    let dataOnly = true
    let cells: any = {}
    for (let [key, cell] of Object.entries(sheet)) {
      if (key.startsWith('!')) continue
      if (cell.f) dataOnly = false
      cells[key] = cell
    }

    // Create a part for this sheet
    let part = (dataOnly ? decodeDatatable : decodeTable)(name, sheet, cells)

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

function encodeNode(node: stencila.Node): xlsx.WorkBook {
  const type_ = type(node)

  const sheetNames: Array<string> = []
  const sheets: { [key: string]: xlsx.WorkSheet } = {}
  if (type_ === 'Collection') {
    const collection = node as stencila.Collection
    if (collection.parts && collection.parts.length > 0) {
      let index = 1
      for (const part of collection.parts) {
        const name = part.name || `Sheet${index}`
        sheetNames.push(name)
        sheets[name] = encodeCreativeWork(part)
        index += 1
      }
    } else {
      // xlsx.Workbooks must have at least one sheet
      const name = collection.name || 'Empty'
      sheetNames.push(name)
      sheets[name] = {}
    }
  } else {
    const cw = node as stencila.CreativeWork
    const name = cw.name || 'Sheet1'
    sheetNames.push(name)
    sheets[name] = encodeCreativeWork(cw)
  }

  const workbook: xlsx.WorkBook = {
    SheetNames: sheetNames,
    Sheets: sheets
  }
  return workbook
}

function encodeCreativeWork(node: stencila.CreativeWork) {
  if (node.type === 'Table') return encodeTable(node as stencila.Table)
  else if (node.type === 'Datatable') {
    return encodeDatatable(node as stencila.Datatable)
  } else throw new Error(`Unhandled node type "${node.type}"`)
}

// Worksheet <-> Table

interface CellMap {
  [cell: string]: xlsx.CellObject
}

interface RowMap {
  [row: string]: {
    [column: string]: stencila.TableCell
  }
}

/**
 * Convert spreadsheet worksheet, a column-indexed table data format, to a RowMap,
 * a row-indexed data representation.
 *
 * @param {CellMap} Map
 * @returns {RowMap}
 */
const cellMapToRowMap = (cells: CellMap): RowMap =>
  Object.entries(cells).reduce((rowMap: RowMap, [name, cell]) => {
    const coords = parseRowAndColumn(name)
    if (coords) {
      const [alpha, num] = coords
      return {
        ...rowMap,
        [num]: {
          ...(rowMap[num] || {}),
          [alpha]: {
            name: alpha + num,
            ...xlsxCelltoStencilaCell(cell)
          }
        }
      }
    } else {
      return rowMap
    }
  }, {})

/**
 * Convert data structured as a RowMap to Stencila TableRow for further
 * processing or rendering.
 * @param {RowMap} rowMap
 * @returns {stencila.TableRow[]}
 */
const rowMapToTableRows = (rowMap: RowMap): stencila.TableRow[] => {
  // TODO: This is required to make TypeDoc happy, since it uses an older version of TypeScript.
  // It should be removed once TypeDoc is updated
  const enum types {
    TABLE_ROW = 'TableRow'
  }

  return Object.values(rowMap).map(row => ({
    type: types.TABLE_ROW,
    cells: Object.values(row)
  }))
}

const decodeTable = (
  name: string,
  sheet: xlsx.WorkSheet,
  cells: CellMap
): stencila.Table => ({
  type: 'Table',
  name,
  rows: pipe(
    cells,
    cellMapToRowMap,
    rowMapToTableRows
  )
})

const encodeTable = (table: stencila.Table): xlsx.WorkSheet =>
  table.rows.reduce(
    (sheet: xlsx.WorkSheet, row) => {
      row.cells.map((cell: stencila.TableCell) => {
        if (cell.name) {
          sheet[cell.name] = encodeCell(cell.content[0])
        }
      })

      return { ...sheet, '!ref': calcSheetRange(Object.keys(sheet)) }
    },
    { '!ref': 'A1:A1' }
  )

// Worksheet <-> Datatable

function decodeDatatable(
  name: string,
  sheet: xlsx.WorkSheet,
  cells: CellMap
): stencila.Datatable {
  // Empty values need to be replaced with `null`
  // so determine extent of the cells
  const rang = xlsx.utils.decode_range(sheet['!ref'] || 'A1')
  const cols = rang.e.c
  const rows = rang.e.r

  // Convert the list of cells to a list of columns with values
  const columns: Array<any> = range(0, cols).map(col =>
    range(0, rows).map(row => {
      const name = cellPositionToName([col, row])
      const cell = cells[name]
      return cell === undefined ? null : decodeCell(cell)
    })
  )

  // If the first value in each column is a string then
  // treat them as names (and thus remove them from) the
  // values. Otherwise, use automatic, alphabetic names.
  let names: Array<string> = []
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
    name,
    columns: columns.map(function(column, index): stencila.DatatableColumn {
      return {
        type: 'DatatableColumn',
        name: names[index],
        values: column
      }
    })
  }
  return datatable
}

function encodeDatatable(datatable: stencila.Datatable) {
  const sheet: xlsx.WorkSheet = {}
  let columns = datatable.columns
  if (columns) {
    let columnIndex = 0
    let rowIndex = 0
    for (let column of columns) {
      let columnName = columnIndexToName(columnIndex)
      // Name cell
      sheet[`${columnName}1`] = { t: 's', v: column.name }
      // Value cells
      let values = column.values
      if (values) {
        rowIndex = 0
        for (let value of values) {
          const cellObject = encodeCell(value)
          if (cellObject) sheet[`${columnName}${rowIndex + 2}`] = cellObject
          rowIndex += 1
        }
      }
      columnIndex += 1
    }
    sheet['!ref'] = `A1:${columnIndexToName(columnIndex - 1)}${rowIndex + 1}`
  }
  return sheet
}

// CellObject <-> Node

function decodeCell(cell: xlsx.CellObject) {
  let value = cell.v
  if (value) {
    if (value instanceof Date) {
      value = value.toISOString()
    }
  }

  if (cell.f) {
    const expression: stencila.CodeExpr = {
      type: 'CodeExpr',
      programmingLanguage: 'excel',
      text: cell.f.trim()
    }
    if (value) expression.value = value
    return expression
  } else {
    return value || null
  }
}

function encodeCell(node: stencila.Node): xlsx.CellObject | null {
  // tslint:disable-next-line
  if (node === undefined) return null
  if (node === null) return null
  if (typeof node === 'boolean') return { t: 'b', v: node }
  if (typeof node === 'number') return { t: 'n', v: node }
  if (typeof node === 'string') return { t: 's', v: node }
  if (!Array.isArray(node) && node.type) {
    switch (node.type) {
      case 'CodeExpr': {
        const expr = node as stencila.CodeExpr
        const cell: xlsx.CellObject = { t: 'b', f: expr.text }
        if (expr.value) {
          const value = encodeCell(expr.value)
          if (value) {
            cell.t = value.t
            cell.v = value.v
          }
        }
        return cell
      }
    }
  }

  throw new TypeError(`Unhandled node type ${typeof node}`)
}

/**
 * Convert spreadsheet formatted cell to a Stencila Table Cell
 *
 * @param {xlsx.CellObject} cell
 * @returns {stencila.TableCell}
 */
const xlsxCelltoStencilaCell = (cell: xlsx.CellObject): stencila.TableCell => ({
  type: 'TableCell',
  content: [decodeCell(cell)]
})

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
 * Convert a column name (e.g. `AA`) into an index (e.g. `27`)
 *
 * Thanks to https://stackoverflow.com/a/46173864.
 *
 * @param name The column name
 */
export function columnNameToIndex(name: string) {
  let index = 0
  for (let position = 0; position < name.length; position++) {
    index = name[position].charCodeAt(0) - 64 + index * 26
  }
  return index - 1
}

/**
 * Convert a cell name e.g. `A2` to a position e.g. `[0, 1]`
 *
 * @param name The name of the cell
 */
export function cellNameToPosition(name: string): [number, number] {
  const match = name.match(cellNameRegEx)
  if (!match) throw new Error(`Unexpected cell name "${name}".`)
  const column = columnNameToIndex(match[1])
  const row = parseInt(match[2], 10) - 1
  return [column, row]
}

/**
 * Convert a cell position e.g. `[0, 1]` to a name e.g. `A2`
 *
 * @param position The position of the cell
 */
export function cellPositionToName(position: [number, number]): string {
  return `${columnIndexToName(position[0])}${position[1] + 1}`
}

/**
 * Parses a cell coordinate name such as `B47` into it's alpha and numeric parts.
 * This is used to convert a column-indexed table data into a row-indexed table
 * (such as the one found in HTML `table` markup).
 *
 * @param {string} name
 * @returns {[string, number]}
 */
const parseRowAndColumn = (name: string): [string, number] => {
  const match = name.match(cellNameRegEx)
  return match ? [match[1], parseInt(match[2], 10)] : ['A', 1]
}

/**
 * Calculates the dimensions of the sheet so that all necessary cells are processed
 *
 * @param {string[]} coords
 * @returns string
 * @example ['A1', 'A2', 'B220', 'AH17'] => 'A1:AH220'
 */
const calcSheetRange = (coords: string[]): string => {
  const coordMap = coords.reduce(
    (cellMap, coord) => {
      const [col, row] = parseRowAndColumn(coord)

      return {
        cols: cellMap.cols.add(col),
        rows: cellMap.rows.add(row.toString())
      }
    },
    { cols: new Set('A'), rows: new Set('1') }
  )

  const maxCol = maxCell(coordMap.cols, () => 'A')
  const maxRow = maxCell(coordMap.rows, () => '1')

  return `A1:${maxCol}${maxRow}`
}

// A function defining how to order strings based on their character length
const ordLength: ord.Ord<string> = ord.contramap(ord.ordNumber, s => s.length)

/**
 * Given a list/Set of strings, determines the maximum value. First by string
 * length, then by alphabetical/numerical order.
 *
 * @param {(Set<string> | string[])} cells ['A1', 'A2', 'B1', 'B2', ...]
 * @param {() => string} defaultValue A function returning a constant value to
 * be returned in case of failure such as an empty list given as input
 */
const maxCell = (cells: Set<string> | string[], defaultValue: () => string) =>
  pipe(
    [...cells],
    array.sortBy([ordLength, ord.ordString]),
    array.last,
    option.getOrElse(defaultValue)
  )
