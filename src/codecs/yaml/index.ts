/**
 * [[include:src/codecs/yaml/README.md]]
 *
 * @module codecs/yaml
 */

import schema from '@stencila/schema'
import yaml from 'js-yaml'
import orderProperties from '../../util/orderProperties'
import * as vfile from '../../util/vfile'
import { Codec } from '../types'

export class YamlCodec extends Codec implements Codec {
  public readonly mediaTypes = ['text/yaml']

  public readonly decode = async (file: vfile.VFile): Promise<schema.Node> => {
    const yml = await vfile.dump(file)
    return yaml.load(yml) ?? null
  }

  public readonly encode = (node: schema.Node): Promise<vfile.VFile> => {
    const ordered = orderProperties(node)
    const yml = yaml.dump(ordered, {
      // "do not throw on invalid types (like function in the safe schema)
      // and skip pairs and single values with such types."
      skipInvalid: true,
    })
    return Promise.resolve(vfile.load(yml))
  }
}
