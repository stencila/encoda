import * as Sast from './sast'
import * as Csf from 'xlsx'

/**
 * Transform (Common Spreadsheet Format)[https://github.com/SheetJS/js-xlsx#common-spreadsheet-format]
 * to Stencila AST.
 *
 * @param csf The CSF to transform
 */
export function csf2sast (csf: Csf.WorkBook): Sast.Node {
  return csf
  // return documentFromWorkbook(csf)
}

/**
 *  Transform Stencila AST to CSF
 *
 * @param sast The SAST to transform
 */
export function sast2csf (sast: Sast.Node): Csf.WorkBook {
  return sast as Csf.WorkBook
  // return documentToWorkbook(sast)
}

function documentFromWorkbook (csf: Csf.WorkBook): Sast.Node {

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

function cellFromCellObject (cell: Csf.CellObject) {
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

function documentToWorkbook (sast: Sast.Node): Csf.WorkBook {
  // @ts-ignore
  return null as Csf.WorkBook
}
