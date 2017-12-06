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

  get fileExternal () {
    // TODO file extension based on format
    return 'external.txt'
  }

  /**
   * @override
   */
  import (pathFrom, pathTo, volumeFrom, volumeTo, options = {}) {
    return this.prepareImport(...arguments).then(({ pathFrom, pathTo, volumeFrom, volumeTo }) => {
      return this.readFile(pathFrom, volumeFrom, options).then((content) => {
        options.header = options.header === true

        const result = papa.parse(content.trim(), {
          header: options.header
        })
        const rows = result.data
        const names = Object.keys(rows[0])

        return this.createDom().then((dom) => {
          if (options.header) {
            const columnsEl = dom('meta columns')
            names.forEach((name) => {
              columnsEl.append(dom('<column>').attr('name', name))
            })
          }

          const dataEl = dom('data')
          rows.forEach((row) => {
            const rowEl = dom('<row>')
            names.forEach((name) => {
              rowEl.append(dom('<cell>').text(row[name]))
            })
            dataEl.append(rowEl)
          })

          return this.writeXml(pathTo, dom, volumeTo).then(() => {
            return pathTo
          })
        })
      })
    })
  }
}
