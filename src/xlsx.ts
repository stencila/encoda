/**
 * Compiler for Microsoft Excel.
 *
 * Also acts as base implementation for other spreadsheet based formats
 */

import { Thing } from '@stencila/schema'
import * as xlsx from 'xlsx'
import { load, VFile } from './vfile'

export const mediaTypes = [
  // spell-checker: disable
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  // spell-checker: enable
]

export async function parse(file: VFile): Promise<Thing> {
  let workbook = xlsx.read(file.contents, {
    type: 'buffer'
  })
  return csf2sast(workbook)
}

export async function unparse(
  node: Thing,
  filePath?: string,
  format: string = 'xlsx'
): Promise<VFile> {
  const workbook = sast2csf(node)
  const buffer = xlsx.write(workbook, {
    type: 'buffer',
    bookType: format as xlsx.BookType
  })
  return load(buffer)
}

/**
 * Transform (Common Spreadsheet Format)[https://github.com/SheetJS/js-xlsx#common-spreadsheet-format]
 * to Stencila AST.
 *
 * @param csf The CSF to transform
 */
export function csf2sast(csf: xlsx.WorkBook): Thing {
  return (csf as unknown) as Thing
  // return documentFromWorkbook(csf)
}

/**
 *  Transform Stencila AST to CSF
 *
 * @param sast The SAST to transform
 */
export function sast2csf(thing: Thing): xlsx.WorkBook {
  return (thing as unknown) as xlsx.WorkBook
  // return documentToWorkbook(sast)
}

function documentFromWorkbook(csf: xlsx.WorkBook): Thing {
  const body = []
  for (let name of csf.SheetNames) {
    let sheet = csf.Sheets[name]

    let type = 'Datatable'
    let cells: any = {}
    for (let [key, cell] of Object.entries(sheet)) {
      if (key.startsWith('!')) continue
      if (cell.f) type = 'Table'
      cells[key] = cellFromCellObject(cell)
    }

    let value
    if (type === 'Datatable') {
      value = {
        type: type,
        columns: []
      }
    } else {
      value = {
        type: type,
        cells: cells
      }
    }

    body.push({
      type: 'Sheet',
      name: name,
      value: value
    })
  }
  return {
    type: 'Document',
    body: body
  }
}

function cellFromCellObject(cell: xlsx.CellObject) {
  if (cell.f) {
    return {
      type: 'Expression',
      lang: 'excel',
      code: cell.f
    }
  } else {
    return cell.v
  }
}

function documentToWorkbook(thing: Thing): xlsx.WorkBook {
  // @ts-ignore
  return null as xlsx.WorkBook
}
