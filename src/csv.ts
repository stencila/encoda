/**
 * Codec for comma separated values (CSV)
 */

import stencila from '@stencila/schema'
import { Encode } from '.'
import { VFile } from './vfile'
import * as xlsx from './xlsx'

export const mediaTypes = ['text/csv']

export async function decode(file: VFile): Promise<stencila.Node> {
  return xlsx.decode(file)
}

export const encode: Encode = async (node: stencila.Node): Promise<VFile> => {
  return xlsx.encode(node, undefined, 'csv')
}
