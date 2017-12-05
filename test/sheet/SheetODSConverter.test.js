import SheetODSConverter from '../../src/sheet/SheetODSConverter'
import helpers from '../helpers'

const converter = new SheetODSConverter()
const { testMatch, testImport } = helpers(converter, 'sheet')

testMatch(
  ['data.ods'],
  ['data.csv']
)

testImport('simple.ods-content.xml', 'simple.sheet')
testImport('simple.ods', 'simple.sheet')
