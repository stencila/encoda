import SheetDSVConverter from '../../src/sheet/SheetDSVConverter'
import helpers from '../helpers'

const converter = new SheetDSVConverter()
const { testMatch, testImport } = helpers(converter, 'sheet')

testMatch(
  ['data.csv', 'data.tsv', 'data.psv'],
  ['data.xlsx']
)

testImport('simple.csv', 'simple.sheet', { header: false })
