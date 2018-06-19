const SheetConverter = require('./SheetConverter')

/**
 * Converter to import/export a Sheet from/to an XSLX files
 *
 */
class XLSXConverter extends SheetConverter {
  id () {
    return 'xlsx'
  }

  options () {
    return Object.assign(super.options(), {
      from: 'xlsx',
      to: 'xlsx'
    })
  }
}

module.exports = XLSXConverter
