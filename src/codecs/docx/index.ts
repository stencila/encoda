/**
 * @module docx
 */

import stencila from '@stencila/schema'
import path from 'path'
import * as vfile from '../../util/vfile'
import * as P from '../pandoc'
import { dataDir } from '../pandoc/binary'
import { Codec, GlobalEncodeOptions } from '../types'

const pandoc = new P.Pandoc()

interface EncodeOptions {
  templatePath?: string
}

export class Docx extends Codec<EncodeOptions> implements Codec<EncodeOptions> {
  public mediaTypes = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]

  public decode = async (file: vfile.VFile): Promise<stencila.Node> => {
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

  public encode = async (
    node: stencila.Node,
    { filePath, codecOptions = {} }: GlobalEncodeOptions<EncodeOptions> = {}
  ): Promise<vfile.VFile> =>
    pandoc.encode(node, {
      filePath,
      format: P.OutputFormat.docx,
      codecOptions: {
        flags: [
          `--reference-doc=${codecOptions.templatePath ||
            Docx.defaultTemplatePath}`
        ],
        ensureFile: true
      }
    })
}
