import * as Sast from './sast'
import * as Csf from 'xlsx'

/**
 * Transform (Common Spreadsheet Format)[https://github.com/SheetJS/js-xlsx#common-spreadsheet-format]
 * to Stencila AST.
 *
 * @param csf The CSF to transform
 */
export function from (csf: Csf.WorkBook): Sast.Node {
  // TODO: transform csf to sast
  return csf
}

/**
 *  Transform Stencila AST to CSF
 *
 * @param sast The SAST to transform
 */
export function to (sast: Sast.Node): Csf.WorkBook {
  // TODO: transform sast to csf
  return sast as Csf.WorkBook
}
