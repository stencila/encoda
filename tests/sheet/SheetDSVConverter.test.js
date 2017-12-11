const SheetDSVConverter = require('../../src/sheet/SheetDSVConverter')
const helpers = require('../helpers')

const converter = new SheetDSVConverter()
const { testCanImport, testImport, testExport } = helpers(converter, 'sheet')

testCanImport(
  ['data.csv', 'data.tsv'],
  ['data.foo', 'data.xlsx']
)

testImport('simple/csv/simple.csv', 'simple/stencila/simple.sheet.xml', { header: false })
testImport('simple/tsv/simple.tsv', 'simple/stencila/simple.sheet.xml', { header: false })

testExport('simple/stencila/simple.sheet.xml', 'simple/csv/simple.csv')
