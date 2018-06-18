const SheetConverter = require('./SheetConverter')

/**
 * Converter to import/export a Sheet from/to an XSLX files
 *
 */
class SheetXLSXConverter extends SheetConverter {
  id () {
    return 'xlsx-skip'
  }
}

module.exports = SheetXLSXConverter
