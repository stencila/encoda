/**
 * @module yaml
 */

import * as stencila from '@stencila/schema'
import yaml from 'js-yaml'
import { Encode } from '../types'
import * as vfile from '../../util/vfile'

export const mediaTypes = ['text/yaml']

export async function decode(file: vfile.VFile): Promise<stencila.Node> {
  const yml = await vfile.dump(file)
  return yaml.safeLoad(yml)
}

export const encode: Encode = async (
  node: stencila.Node
): Promise<vfile.VFile> => {
  const yml = yaml.safeDump(node, {
    // "do not throw on invalid types (like function in the safe schema)
    // and skip pairs and single values with such types."
    skipInvalid: true
  })
  return vfile.load(yml)
}
