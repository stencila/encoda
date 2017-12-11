const SheetODSConverter = require('../../src/sheet/SheetODSConverter')
const helpers = require('../helpers')

const converter = new SheetODSConverter()
const { testCanImport, testImport } = helpers(converter, 'sheet')

testCanImport(
  ['data.ods'],
  ['data.foo', 'data.csv']
)

testImport('simple/ods/simple.ods', 'simple/stencila/simple.sheet.xml')
