const SheetConverter = require('./SheetConverter')

/**
 * Converter to import/export a Sheet from/to an XSLX files
 *
 */
class SheetXLSXConverter extends SheetConverter {
  canImport (pathFrom) {
    return this.matchExtensions(pathFrom, ['xlsx'])
  }
}

module.exports = SheetXLSXConverter
