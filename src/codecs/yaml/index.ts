/**
 * @module yaml
 */

import * as stencila from '@stencila/schema'
import yaml from 'js-yaml'
import * as vfile from '../../util/vfile'
import { Codec } from '../types'

export class YamlCodec extends Codec implements Codec {
  public mediaTypes = ['text/yaml']

  public decode = async (file: vfile.VFile): Promise<stencila.Node> => {
    const yml = await vfile.dump(file)
    return yaml.safeLoad(yml)
  }

  public encode = async (node: stencila.Node): Promise<vfile.VFile> => {
    const yml = yaml.safeDump(node, {
      // "do not throw on invalid types (like function in the safe schema)
      // and skip pairs and single values with such types."
      skipInvalid: true
    })
    return vfile.load(yml)
  }
}
