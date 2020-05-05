/**
 * @module csv
 */

import * as stencila from '@stencila/schema'
import { getLogger } from '@stencila/logga'
import * as papaparse from 'papaparse'
import { range, head } from 'fp-ts/lib/Array'
import * as vfile from '../../util/vfile'
import { Codec } from '../types'
import { columnIndexToName } from '../xlsx'

const log = getLogger('encoda:csv')

export class CsvCodec extends Codec implements Codec {
  public readonly mediaTypes = ['text/csv']

  public readonly decode = async (
    file: vfile.VFile
  ): Promise<stencila.Node> => {
    const csv = await vfile.dump(file)

    // Trim trailing newline
    const csvTrimmed = csv.replace(/(\r|\n)*$/g, '')

    const { data, errors } = papaparse.parse(csvTrimmed, {
      // We detect ourselves whether a header is present below
      header: false,
      // Turn on dynamic typing so that booleans and numbers are coerced
      dynamicTyping: true,
    })

    for (const error of errors) {
      // According to the https://www.papaparse.com/docs#errors:
      //   "Just because errors are generated does not necessarily mean that parsing failed.
      //   The worst error you can get is probably MissingQuotes."
      // So log a warning, not an error.
      const { code, message, row } = error
      const location =
        (file.path !== undefined ? file.path + ':' : '') + row.toString()
      log.warn(`${location} ${code} ${message}`)
    }

    // Detect if there is a header row
    // The first row is considered a header if all values are strings
    let headerRow = true
    let columnNum = 0
    let columnNames: string[] = []
    if (data.length > 0) {
      columnNum = data[1].length
      for (const cell of data[0]) {
        if (typeof cell === 'string') {
          columnNames.push(cell)
        } else {
          headerRow = false
          break
        }
      }
    }

    // Default to using column names to A, B,..., AA, AB etc
    if (!headerRow) columnNames = range(0, columnNum - 1).map(columnIndexToName)

    const rowNum = data.length - (headerRow ? 1 : 0)

    // Create columns with pre-allocated array of correct length
    const columns = columnNames.map((name) => {
      return stencila.datatableColumn({
        name,
        values: Array(rowNum),
      })
    })

    // Populate the column values with data
    for (let rowIndex = 0; rowIndex < rowNum; rowIndex++) {
      const row = data[rowIndex + (headerRow ? 1 : 0)]
      for (let columnIndex = 0; columnIndex < columnNum; columnIndex++) {
        const value = row[columnIndex]
        columns[columnIndex].values[rowIndex] =
          value !== undefined ? value : null
      }
    }

    return stencila.datatable({ columns })
  }

  public readonly encode = (node: stencila.Node): Promise<vfile.VFile> => {
    if (!stencila.isA('Datatable', node)) {
      log.error(
        `When encoding to CSV expected a Datatable, but got a ${stencila.nodeType(
          node
        )}`
      )
      return Promise.resolve(vfile.create())
    }

    // Transform column-wise data to row-wise
    const columnNum = node.columns.length
    const rowNum = columnNum > 0 ? node.columns[0].values.length : 0
    const data: unknown[][] = Array.from({ length: rowNum }, () =>
      Array(columnNum)
    )
    for (let rowIndex = 0; rowIndex < rowNum; rowIndex++) {
      for (let columnIndex = 0; columnIndex < columnNum; columnIndex++) {
        data[rowIndex][columnIndex] = node.columns[columnIndex].values[rowIndex]
      }
    }

    const fields = node.columns.map((column) => column.name)
    const csv = papaparse.unparse({ fields, data })

    return Promise.resolve(vfile.load(csv))
  }
}
