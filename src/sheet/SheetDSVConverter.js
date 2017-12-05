import papa from 'papaparse'
import path_ from 'path'

import SheetConverter from './SheetConverter'
import fs from '../util/fsAsync'

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
    return fromFs.readFileAsync(from, {encoding: 'utf8'}).then((dsv) => {
      options.header = options.header === true

      const result = papa.parse(dsv.trim(), {
        header: options.header
      })
      const rows = result.data
      const names = Object.keys(rows[0])

      const xml = this._xmlCreate()

      if (options.header) {
        const columnsEl = xml.find('meta columns')
        names.forEach((name) => {
          columnsEl.append(xml.create('<column>').attr('name', name))
        })
      }

      const dataEl = xml.find('data')
      rows.forEach((row) => {
        const rowEl = xml.create('<row>')
        names.forEach((name) => {
          rowEl.append(xml.create('<cell>').text(row[name]))
        })
        dataEl.append(rowEl)
      })

      const toPath = path_.join(to, 'index.sheet.xml')
      const toXml = xml.dump() + '\n'
      return toFs.writeFileAsync(toPath, toXml)
    })
  }
}
