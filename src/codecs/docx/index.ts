/**
 * @module docx
 */

import stencila from '@stencila/schema'
import { getTheme } from '@stencila/thema'
import path from 'path'
import * as vfile from '../../util/vfile'
import * as P from '../pandoc'
import { dataDir } from '../pandoc/binary'
import { Codec, defaultEncodeOptions, GlobalEncodeOptions } from '../types'

const pandoc = new P.PandocCodec()

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
      from: P.InputFormat.docx
    })
  }

  /** Used to style conversion outputs targeting Microsoft Word */
  private static defaultTemplatePath = path.join(
    dataDir,
    'templates',
    'stencila-template.docx'
  )

  public readonly encode = async (
    node: stencila.Node,
    {
      filePath,
      codecOptions = {}
    }: GlobalEncodeOptions<EncodeOptions> = defaultEncodeOptions
  ): Promise<vfile.VFile> =>
    pandoc.encode(node, {
      filePath,
      format: P.OutputFormat.docx,
      theme: getTheme(),
      codecOptions: {
        flags: [
          `--reference-doc=${codecOptions.templatePath ||
            DocxCodec.defaultTemplatePath}`
        ],
        ensureFile: true
      }
    })
}
