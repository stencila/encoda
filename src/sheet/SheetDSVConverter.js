import fs from 'fs'
import papa from 'papaparse'
import path from 'path'

import SheetConverter from './SheetConverter'

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
  match (path_) {
    return new Promise((resolve) => {
      const ext = path.extname(path_)
      const matched = ['.csv', '.tsv', '.psv'].indexOf(ext) > -1
      return resolve(matched)
    })
  }

  /**
   * @override
   */
  import (from, to, fromFs = fs, toFs = null, options = {}) {
    toFs = toFs || fromFs

    return this.readFile(fromFs, from, 'utf8').then((content) => {
      options.header = options.header === true

      const result = papa.parse(content.trim(), {
        header: options.header
      })
      const rows = result.data
      const names = Object.keys(rows[0])

      const sheet = this.loadXml()

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

      const main = path.join(to, 'index.sheet.xml')
      return this.writeFile(toFs, main, this.dumpXml(sheet)).then(() => {
        return main
      })
    })
  }
}
