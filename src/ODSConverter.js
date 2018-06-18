const SheetConverter = require('./SheetConverter')

/**
 * Converter to import/export a Sheet from/to an Open Document Spreadsheet (ODS) file
 *
 */
class ODSConverter extends SheetConverter {
  id () {
    return 'ods-skip'
  }
}

module.exports = ODSConverter
