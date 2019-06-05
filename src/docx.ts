/**
 * Codec for Microsoft Word
 */

import stencila from '@stencila/schema'
import path from 'path'
import { Encode } from '.'
import { home } from './boot'
import * as pandoc from './pandoc'
import { VFile } from './vfile'

export const mediaTypes = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]

export async function decode(file: VFile): Promise<stencila.Node> {
  return pandoc.decode(
    file,
    pandoc.InputFormat.docx,
    [`--extract-media=${file.path}.media`],
    true
  )
}

/** Used to style conversion outputs targeting Microsoft Word */
const defaultDocxTemplatePath = path.join(
  home,
  'src',
  'templates',
  'stencila-template.docx'
)

export const encode: Encode = async (
  node: stencila.Node,
  filePath?: string,
  templatePath: string = defaultDocxTemplatePath
): Promise<VFile> => {
  return pandoc.encode(
    node,
    filePath,
    pandoc.OutputFormat.docx,
    [`--reference-doc=${templatePath}`],
    true
  )
}
