import schema from '@stencila/schema'
import * as vfile from '../../util/vfile'
import { LatexCodec } from '../latex'
import { Codec, CommonDecodeOptions, CommonEncodeOptions } from '../types'

const latex = new LatexCodec()

export class NwCodec extends Codec implements Codec {
  public readonly mediaTypes = ['application/x-nw']

  public readonly extNames = ['nw', 'rnw']

  public readonly decode = async (
    file: vfile.VFile,
    options: CommonDecodeOptions = this.commonDecodeDefaults
  ): Promise<schema.Node> => {
    return latex.decode(file, options)
  }

  public readonly encode = async (
    node: schema.Node,
    options: CommonEncodeOptions = this.commonEncodeDefaults
  ): Promise<vfile.VFile> => {
    return latex.encode(node, options)
  }
}
