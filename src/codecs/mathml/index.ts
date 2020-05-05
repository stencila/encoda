/**
 * @module mathml
 */

import stencila from '@stencila/schema'
import * as vfile from '../../util/vfile'
import * as xml from '../../util/xml'
import { Codec } from '../types'
import { getLogger } from '@stencila/logga'
// @ts-ignore
import MathJax from 'mathjax-node'
import fs from 'fs-extra'

const log = getLogger('encoda:mathml')

export class MathMLCodec extends Codec implements Codec {
  /**
   * The media types that this codec can decode/encode.
   *
   * @see https://www.w3.org/Math/mathml-faq.html
   */
  public readonly mediaTypes = ['application/mathml+xml']

  /**
   * The file extension names that this codec will match.
   */
  public readonly extNames = ['mathml']

  /**
   * Sniff content to see if it is MathML.
   *
   * For speed, rather than parsing the entire content as XML, this
   * function just uses a regex to checks if the content starts with
   * a `<math>` node.
   *
   * @param content The content to be sniffed
   */
  public readonly sniff = async (content: string): Promise<boolean> => {
    if (await fs.pathExists(content)) {
      const stat = await fs.stat(content)
      if (stat.isFile()) content = await fs.readFile(content, 'utf8')
    }
    return /^\s*<math\b/.test(content)
  }

  /**
   * Decode a `VFile` with MathML content to a Stencila `Math` node.
   *
   * Parses the XML but currently, does not do any validation to ensure that
   * it is MathML.
   *
   * @param file The `VFile` to decode
   * @returns A promise that resolves to a Stencila `MathBlock` or `MathFragment`
   *          depending upon the `display` attribute of the top level `<math>`
   *          element. Defaults to `MathFragment` (i.e. `display="inline"`)
   */
  public readonly decode = async (
    file: vfile.VFile
  ): Promise<stencila.Math> => {
    const content = await vfile.dump(file)
    const mathml = await xml.load(content)
    const display = xml.attr(xml.child(mathml, 'math'), 'display')
    return (display === 'block' ? stencila.mathBlock : stencila.mathFragment)({
      mathLanguage: 'mathml',
      text: xml.dump(mathml),
    })
  }

  /**
   * Encode a Stencila `Math` node to a `VFile` with MathML content.
   *
   * Attempts to translate other math languages that the node may
   * have (e.g TeX) to MathML.
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

    let mathml
    if (format === 'mathml') mathml = text
    else if (format === 'tex' || format === 'asciimath') {
      const result = await MathJax.typeset({
        math: text,
        format: format === 'tex' ? 'TeX' : 'AsciiMath',
        mml: true,
      })
      mathml = result.mml
    } else {
      log.warn(`Unable to translate math language to MathML: ${mathLanguage}`)
      mathml = ''
    }
    return vfile.load(mathml)
  }
}
