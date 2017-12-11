const SheetXLSXConverter = require('../../src/sheet/SheetXLSXConverter')
const helpers = require('../helpers')

const converter = new SheetXLSXConverter()
const { testCanImport, testImport } = helpers(converter, 'sheet')

testCanImport(
  ['data.xlsx'],
  ['data.foo', 'data.csv']
)

testImport('simple/xlsx/simple.xlsx', 'simple/stencila/simple.sheet.xml')
