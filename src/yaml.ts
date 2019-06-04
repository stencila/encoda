/**
 * Codec for YAML
 */

import * as stencila from '@stencila/schema'
import yaml from 'js-yaml'
import { dump, load, VFile } from './vfile'

export const mediaTypes = ['text/yaml']

export async function decode(file: VFile): Promise<stencila.Node> {
  const yml = await dump(file)
  return yaml.safeLoad(yml)
}

export async function encode(node: stencila.Node): Promise<VFile> {
  const yml = yaml.safeDump(node, {
    // "do not throw on invalid types (like function in the safe schema)
    // and skip pairs and single values with such types."
    skipInvalid: true
  })
  return load(yml)
}
