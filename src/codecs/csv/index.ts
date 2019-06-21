/**
 * Codec for comma separated values (CSV)
 */

import stencila from '@stencila/schema'
import { Encode } from '../..'
import * as vfile from '../../vfile'
import * as xlsx from '../xlsx'

export const mediaTypes = ['text/csv']

export async function decode(file: vfile.VFile): Promise<stencila.Node> {
  return xlsx.decode(file)
}

export const encode: Encode = async (
  node: stencila.Node
): Promise<vfile.VFile> => {
  return xlsx.encode(node, { format: 'csv' })
}
