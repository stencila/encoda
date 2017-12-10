const SheetXLSXConverter = require('../../src/sheet/SheetXLSXConverter')
const helpers = require('../helpers')

const converter = new SheetXLSXConverter()
const { testCanImport } = helpers(converter, 'sheet')

testCanImport(
  ['data.xlsx'], // OK
  ['data.csv'] // not OK
)
