const SheetODSConverter = require('../../src/sheet/SheetODSConverter')
const helpers = require('../helpers')

const converter = new SheetODSConverter()
const { testMatch, testImport } = helpers(converter, 'sheet')

testMatch(
  ['data.ods'],
  ['data.csv']
)

testImport('simple/simple.ods-content.xml', 'simple/simple.sheet')
testImport('simple/simple.ods', 'simple/simple.sheet')
