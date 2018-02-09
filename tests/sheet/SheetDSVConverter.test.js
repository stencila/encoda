const SheetDSVConverter = require('../../src/sheet/SheetDSVConverter')
const helpers = require('../helpers')

const converter = new SheetDSVConverter()
const { testCanImport, testImport, testExport } = helpers(converter, 'sheet')

testCanImport(
  ['data.csv', 'data.tsv'],
  ['data.foo', 'data.xlsx']
)

testImport('simple/csv/simple.csv', 'simple/dar/simple.sheet.xml', { header: false })
testImport('simple/tsv/simple.tsv', 'simple/dar/simple.sheet.xml', { header: false })
testExport('simple/dar/simple.sheet.xml', 'simple/csv/simple.csv')

testImport('starwars-people/csv/starwars-people.csv', 'starwars-people/dar/starwars-people.sheet.xml')

testImport('mini-calcs/tsv/mini-calcs.tsv', 'mini-calcs/dar/mini-calcs.sheet.xml')
testImport('r-calcs/tsv/r-calcs.tsv', 'r-calcs/dar/r-calcs.sheet.xml')
