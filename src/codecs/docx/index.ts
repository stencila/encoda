/**
 * @module docx
 */

import stencila from '@stencila/schema'
import { getTheme } from '@stencila/thema'
import path from 'path'
import { ensureArticle } from '../../util/content/ensureArticle'
import * as vfile from '../../util/vfile'
import { stylesDir } from '../csl'
import * as Pandoc from '../pandoc'
import { dataDir } from '../pandoc/binary'
import { Codec, GlobalEncodeOptions } from '../types'

const pandoc = new Pandoc.PandocCodec()

interface EncodeOptions {
  templatePath?: string
}

export class DocxCodec extends Codec<EncodeOptions>
  implements Codec<EncodeOptions> {
  public readonly mediaTypes = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]

  public readonly decode = async (
    file: vfile.VFile
  ): Promise<stencila.Node> => {
    return pandoc.decode(file, {
      ensureFile: true,
      flags: [`--extract-media=${file.path}.media`],
      from: Pandoc.InputFormat.docx
    })
  }

  /** Used to style conversion outputs targeting Microsoft Word */
  private static defaultTemplatePath = path.join(
    dataDir,
    'templates',
    'stencila-template.docx'
  )

  /**
   * Encode a Stencila `Node` to a Microsoft Word `docx` format.
   *
   * If the node is not an `Article`, it will be wrapped into one.
   */
  public readonly encode = async (
    node: stencila.Node,
    { filePath, codecOptions = {} }: GlobalEncodeOptions<EncodeOptions> = this
      .defaultEncodeOptions
  ): Promise<vfile.VFile> => {
    const article = ensureArticle(node)
    const { references } = article

    const referenceDoc =
      codecOptions.templatePath ?? DocxCodec.defaultTemplatePath

    let flags: string[] = [`--reference-doc=${referenceDoc}`]

    if (references !== undefined) {
      // Currently the style is fixed, but in the future will be an encoding option.
      const cslStyle = path.join(stylesDir, 'apa.csl')
      flags = [
        `--metadata=csl:${cslStyle}`,
        '--metadata=reference-section-title:References'
      ]
    }

    return pandoc.encode(article, {
      filePath,
      format: Pandoc.OutputFormat.docx,
      theme: getTheme(),
      codecOptions: {
        flags,
        ensureFile: true,
        useCiteproc: references !== undefined
      }
    })
  }
}
