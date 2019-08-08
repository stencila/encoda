/**
 * @module docx
 */

import stencila from '@stencila/schema'
import path from 'path'
import { EncodeOptions } from '../..'
import * as vfile from '../../util/vfile'
import * as pandoc from '../pandoc'
import { dataDir } from '../pandoc/binary'
import { Encode } from '../types'

export const mediaTypes = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]

export async function decode(file: vfile.VFile): Promise<stencila.Node> {
  return pandoc.decode(
    file,
    pandoc.InputFormat.docx,
    [`--extract-media=${file.path}.media`],
    true
  )
}

/** Used to style conversion outputs targeting Microsoft Word */
const defaultDocxTemplatePath = path.join(
  dataDir,
  'templates',
  'stencila-template.docx'
)

interface DocXOptions {
  templatePath?: string
}

export const encode: Encode<DocXOptions> = async (
  node: stencila.Node,
  { filePath, codecOptions = {} }: EncodeOptions<DocXOptions> = {}
): Promise<vfile.VFile> =>
  pandoc.encode(node, {
    filePath,
    format: pandoc.OutputFormat.docx,
    codecOptions: {
      flags: [
        `--reference-doc=${codecOptions.templatePath ||
          defaultDocxTemplatePath}`
      ],
      ensureFile: true
    }
  })
