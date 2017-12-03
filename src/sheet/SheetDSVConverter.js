import papa from 'papaparse'
import path_ from 'path'

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
  match (volume, path) {
    return new Promise((resolve) => {
      const ext = path_.extname(path)
      const matched = ['.csv', '.tsv', '.psv'].indexOf(ext) > -1
      return resolve(matched)
    })
  }

  /**
   * @override
   */
  import (from, path, to, name) {
    return new Promise((resolve, reject) => {
      from.readFile(path, 'utf8', (err, dsv) => {
        if (err) return reject(err)
        const result = papa.parse(dsv.trim(), {
          header: true
        })
        const rows = result.data
        const names = Object.keys(rows[0])

        const xml = this._xmlCreate()

        const columnsEl = xml.find('meta columns')
        names.forEach((name) => {
          columnsEl.append(xml.create('<column>').attr('name', name))
        })

        const dataEl = xml.find('data')
        rows.forEach((row) => {
          const rowEl = xml.create('<row>')
          names.forEach((name) => {
            rowEl.append(xml.create('<cell>').text(row[name]))
          })
          dataEl.append(rowEl)
        })

        const main = name + '.sheet.xml'
        to.writeFile(main, xml.dump(), 'utf8', (err) => {
          if (err) return reject(err)
          return resolve(main)
        })
      })
    })
  }
}
