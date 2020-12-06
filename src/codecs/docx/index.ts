/**
 * @module docx
 */

import stencila from '@stencila/schema'
import path from 'path'
import { ensureArticle } from '../../util/content/ensureArticle'
import * as vfile from '../../util/vfile'
import { stylesDir } from '../csl'
import {
  InputFormat,
  OutputFormat,
  PandocCodec,
  EncodeSettings,
  DecodeSettings,
} from '../pandoc'
import { dataDir } from '../pandoc/binary'
import { Codec, CommonDecodeOptions, CommonEncodeOptions } from '../types'

const pandoc = new PandocCodec()

export class DocxCodec extends Codec implements Codec {
  public readonly mediaTypes = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]

  public readonly decode = async (
    file: vfile.VFile,
    options: CommonDecodeOptions = this.commonDecodeDefaults,
    settings: DecodeSettings = {}
  ): Promise<stencila.Node> => {
    return pandoc.decode(file, options, {
      pandocFormat: InputFormat.docx_styles,
      pandocArgs: [`--extract-media=${file.path}.media`],
      ensureFile: true,
      ...settings,
    })
  }

  /**
   * Encode a Stencila `Node` to a Microsoft Word `docx` format.
   *
   * If the node is not an `Article`, it will be wrapped into one.
   */
  public readonly encode = async (
    node: stencila.Node,
    options: CommonEncodeOptions = this.commonEncodeDefaults,
    settings: EncodeSettings = {}
  ): Promise<vfile.VFile> => {
    const article = ensureArticle(node)

    const refDoc = path.join(dataDir, 'templates', 'stencila-template.docx')
    const pandocArgs = [`--reference-doc=${refDoc}`]
    const useCiteproc = article.references !== undefined
    if (useCiteproc) {
      // Currently the style is fixed, but in the future will be an encoding option.
      const cslStyle = path.join(stylesDir, 'apa.csl')
      pandocArgs.push(
        `--metadata=csl:${cslStyle}`,
        '--metadata=reference-section-title:References'
      )
    }

    return pandoc.encode(article, options, {
      pandocFormat: OutputFormat.docx,
      pandocArgs,
      ensureFile: true,
      useCiteproc,
      ...settings,
    })
  }

  /**
   * @override Overrides {@link Codec.preWrite} so that media files
   * do NOT get written to a sibling folder (since they are embedded
   * in the DOCX file).
   */
  public preWrite(node: stencila.Node): Promise<stencila.Node> {
    return Promise.resolve(node)
  }
}
