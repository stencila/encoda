/**
 * Compiler for comma separated values (CSV)
 */

import { Thing } from '@stencila/schema'
import { VFile } from './vfile'
import * as xlsx from './xlsx'

export const mediaTypes = ['text/csv']

export async function parse(file: VFile): Promise<Thing> {
  return xlsx.parse(file)
}

export async function unparse(thing: Thing): Promise<VFile> {
  return xlsx.unparse(thing, undefined, 'csv')
}
