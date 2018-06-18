const SheetConverter = require('./SheetConverter')

/**
 * Converter to import/export a Sheet from/to a delimiter separated values (DSV) file
 *
 * @description
 *
 * There are several dialects of [DSV](https://en.wikipedia.org/wiki/Delimiter-separated_values)
 * the best known of which is CSV (comma separated values).
 *
 * Converts to/from Stencila's internal XML buffer format for Sheets
 */
class SheetDSVConverter extends SheetConverter {
  canImport (pathFrom) {
    return this.matchExtensions(pathFrom, ['csv', 'tsv'])
  }

  import (pathFrom, pathTo, volumeFrom, volumeTo, options = {}) {
    if (options.header !== false) options.header = true
    return super.import(pathFrom, pathTo, volumeFrom, volumeTo, options)
  }
}

module.exports = SheetDSVConverter
