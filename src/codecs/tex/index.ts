/**
 * @module tex
 */

import { getLogger } from '@stencila/logga'
import stencila from '@stencila/schema'
import AsciiMathParser from 'asciimath2tex'
import fs from 'fs-extra'
import path from 'path'
import * as vfile from '../../util/vfile'
import * as xslt from '../../util/xslt'
import { Codec } from '../types'

const log = getLogger('encoda:tex')

// Just-in-time created XSLT processort for MathML to Tex
let mathmlProcessor: xslt.Processor | undefined

export class TexCodec extends Codec implements Codec {
  /**
   * The media types that this codec can decode/encode.
   */
  public readonly mediaTypes = ['application/x-tex']

  /**
   * The file extension names that this codec will match.
   */
  public readonly extNames = ['tex']

  /**
   * Decode a `VFile` with Tex content to a Stencila `Math` node.
   *
   * @param file The `VFile` to decode
   * @returns A promise that resolves to a Stencila `MathFragment`
   *          or `MathBlock` (if it starts with the `\displaystyle` command).
   */
  public readonly decode = async (
    file: vfile.VFile
  ): Promise<stencila.Math> => {
    const tex = await vfile.dump(file)
    const display = /^\s*\\displaystyle/.test(tex)
    return (display ? stencila.mathBlock : stencila.mathFragment)({
      mathLanguage: 'tex',
      text: tex
    })
  }

  /**
   * Encode a Stencila `Math` node to a `VFile` with Tex content.
   *
   * Attempts to translate other math languages that the node may
   * have (e.g AsciiMath) to Tex.
   *
   * @param thing The Stencila `Node` to encode
   * @returns A promise that resolves to a `VFile`
   */
  public readonly encode = async (
    node: stencila.Node
  ): Promise<vfile.VFile> => {
    if (!stencila.nodeIs(stencila.mathTypes)(node)) {
      log.error(`Node is not a math node`)
      return vfile.create()
    }

    const { mathLanguage = 'tex', text } = node
    const format = mathLanguage.toLowerCase()

    let tex
    if (format === 'tex') tex = text
    else if (format === 'asciimath') {
      tex = new AsciiMathParser().parse(text)
    } else if (format === 'mathml') {
      if (mathmlProcessor === undefined) {
        const stylesheet = await fs.readFile(
          path.join(__dirname, 'mmltex.xsl'),
          'utf8'
        )
        const ns = 'http://www.w3.org/1998/Math/MathML'
        mathmlProcessor = await xslt.Processor.create(stylesheet, {
          '': ns,
          mml: ns
        })
      }
      tex = await mathmlProcessor.transform(text)
    } else {
      log.warn(`Unable to translate math language to TeX: ${mathLanguage}`)
      tex = ''
    }
    return vfile.load(tex)
  }
}
