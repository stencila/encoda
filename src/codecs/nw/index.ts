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
    const defaultLanguage = file.path?.toLowerCase().endsWith('.rnw')
      ? 'r'
      : undefined
    const latex = decodeCodeChunk(nw, defaultLanguage)
    return latexCodec.decode(vfile.load(latex), { ...options, defaultLanguage })
  }

  public readonly encode = async (
    node: schema.Node,
    options: CommonEncodeOptions = this.commonEncodeDefaults
  ): Promise<vfile.VFile> => {
    return latexCodec.encode(node, options)
  }
}

/**
 * Decode a Noweb code chunk to a LaTeX `lstlisting` environment.
 *
 * Use https://regex101.com/r/MByuPq/1 for testing out the regex
 */
export function decodeCodeChunk(nw: string, defaultLanguage?: string): string {
  return nw.replace(
    /<<(.*?)>>=((.|\r|\n)*?)\r?\n@\n/g,
    (_match, opts: string, text: string) => {
      const options = opts?.split(/\s*,\s*/)

      let id: string | undefined
      if (options && options.length > 1) {
        id = options[0]
      } else {
        id = opts
      }

      let language = defaultLanguage
      if (id !== undefined) {
        const match = /\.(\w+)$/.exec(id)
        if (match) language = match[1]
      }

      let latex = '\\begin{lstlisting}[exec'
      if (id !== undefined && id !== '') latex += `, id=${id}`
      if (language !== undefined) latex += `, language=${language}`
      return latex + `]\n${text}\n\\end{lstlisting}`
    }
  )
}
