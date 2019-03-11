import { VFile } from 'vfile'
import * as xlsx from 'xlsx'

import { Node } from './sast'
import { from, to } from './sast-csf'

export async function parse (file: VFile): Promise<Node> {
  let workbook
  if (file.path) {
    workbook = xlsx.readFile(file.path)
  } else {
    workbook = xlsx.read(file.contents, {
      type: 'buffer'
    })
  }
  return from(workbook)
}

export async function unparse (node: Node, file: VFile, format: string): Promise<void> {
  const workbook = to(node)
  if (file.path) {
    return new Promise((resolve, reject) => {
      // @ts-ignore
      xlsx.writeFileAsync(file.path, workbook, {
        bookType: format as xlsx.BookType
      }, (error: Error) => error ? reject(error) : resolve())
    })
  } else {
    file.contents = xlsx.write(workbook)
  }
}
