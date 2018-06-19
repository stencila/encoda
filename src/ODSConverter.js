const SheetConverter = require('./SheetConverter')

/**
 * Converter to import/export a Sheet from/to an Open Document Spreadsheet (ODS) file
 *
 */
class ODSConverter extends SheetConverter {
  id () {
    return 'ods'
  }

  options () {
    return Object.assign(super.options(), {
      from: 'ods',
      to: 'ods'
    })
  }
}

module.exports = ODSConverter
