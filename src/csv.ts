/**
 * Compiler for comma separated values (CSV)
 */

import stencila from '@stencila/schema'
import { VFile } from './vfile'
import * as xlsx from './xlsx'

export const mediaTypes = ['text/csv']

export async function parse(file: VFile): Promise<stencila.Node> {
  return xlsx.parse(file)
}

export async function unparse(node: stencila.Node): Promise<VFile> {
  return xlsx.unparse(node, undefined, 'csv')
}
