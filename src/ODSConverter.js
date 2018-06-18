const SheetConverter = require('./SheetConverter')

/**
 * Converter to import/export a Sheet from/to an Open Document Spreadsheet (ODS) file
 *
 */
class SheetODSConverter extends SheetConverter {
  canImport (pathFrom) {
    return this.matchExtensions(pathFrom, ['ods'])
  }
}

module.exports = SheetODSConverter
