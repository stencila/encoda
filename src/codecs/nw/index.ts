/**
 * [[include:src/codecs/nw/README.md]]
 *
 * @module nw
 */

import schema from '@stencila/schema'
import * as vfile from '../../util/vfile'
import { LatexCodec } from '../latex'
import { Codec, CommonDecodeOptions, CommonEncodeOptions } from '../types'

const latexCodec = new LatexCodec()

export class NwCodec extends Codec implements Codec {
  public readonly mediaTypes = ['application/x-nw']

  public readonly extNames = ['nw', 'rnw']

  public readonly decode = async (
    file: vfile.VFile,
    options: CommonDecodeOptions = this.commonDecodeDefaults
  ): Promise<schema.Node> => {
    const nw = await vfile.dump(file)
    const latex = decodeCodeExpression(decodeCodeChunk(nw))
    return latexCodec.decode(vfile.load(latex), options)
  }

  public readonly encode = async (
    node: schema.Node,
    options: CommonEncodeOptions = this.commonEncodeDefaults
  ): Promise<vfile.VFile> => {
    return latexCodec.encode(node, options)
  }
}

export function decodeCodeExpression(nw: string): string {
  // TODO
  return nw
}

// See https://regex101.com/r/MByuPq/1
export function decodeCodeChunk(nw: string): string {
  // TODO Use the correct language
  return nw.replace(
    /<<(.*?)>>=((.|\r|\n)*?)\r?\n@\n/g,
    (_match, label, text) => `\\begin{lstlisting}[language=r exec${
      label !== undefined ? `, id=${label}` : ''
    }]
${text}
\\end{lstlisting}`
  )
}
