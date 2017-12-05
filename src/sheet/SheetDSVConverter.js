import papa from 'papaparse'
import path_ from 'path'

import SheetConverter from './SheetConverter'
import fs from '../util/fs'

/**
 * Converter to import/export a Sheet from/to a delimiter separated values (DSV) file
 *
 * There are several dialects of [DSV](https://en.wikipedia.org/wiki/Delimiter-separated_values)
 * the best known of which is CSV (comma separated values).
 *
 * Converts to/from Stencila's internal XML buffer format for Sheets
 */
export default class SheetDSVConverter extends SheetConverter {
  /**
   * @override
   */
  match (path) {
    return new Promise((resolve) => {
      const ext = path_.extname(path)
      const matched = ['.csv', '.tsv', '.psv'].indexOf(ext) > -1
      return resolve(matched)
    })
  }

  /**
   * @override
   */
  import (from, to, fromFs = fs, toFs = fs, options = {}) {
    return fromFs.readFileAsync(from, {encoding: 'utf8'}).then((content) => {
      options.header = options.header === true

      const result = papa.parse(content.trim(), {
        header: options.header
      })
      const rows = result.data
      const names = Object.keys(rows[0])

      const sheet = this.load()

      if (options.header) {
        const columnsEl = sheet('meta columns')
        names.forEach((name) => {
          columnsEl.append(sheet('<column>').attr('name', name))
        })
      }

      const dataEl = sheet('data')
      rows.forEach((row) => {
        const rowEl = sheet('<row>')
        names.forEach((name) => {
          rowEl.append(sheet('<cell>').text(row[name]))
        })
        dataEl.append(rowEl)
      })

      return toFs.writeFileAsync(
        path_.join(to, 'index.sheet.xml'),
        this.dump(sheet)
      )
    })
  }
}
