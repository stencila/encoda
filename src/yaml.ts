/**
 * Codec for YAML
 */

import * as stencila from '@stencila/schema'
import yaml from 'js-yaml'
import { coerce } from './util'
import { dump, load, VFile } from './vfile'

export const mediaTypes = ['text/yaml']

export async function decode(file: VFile): Promise<stencila.Node> {
  return coerce(yaml.safeLoad(await dump(file)))
}

export async function encode(node: stencila.Node): Promise<VFile> {
  return load(yaml.safeDump(node))
}
