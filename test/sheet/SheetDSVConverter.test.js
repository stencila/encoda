const SheetDSVConverter = require('../../src/sheet/SheetDSVConverter')
const helpers = require('../helpers')

const converter = new SheetDSVConverter()
const { testMatch, testLoad, testImport } = helpers(converter, 'sheet')

testMatch(
  ['data.csv', 'data.tsv', 'data.psv'],
  ['data.xlsx']
)

testLoad(
  'SheetDSVConverter.load simple',
  'A,B\n1,2\n3,4',
  `<sheet>
  <meta>
    <name/>
    <title/>
    <description/>
    <columns/>
  </meta>
  <data>
    <row>
      <cell>A</cell>
      <cell>B</cell>
    </row>
    <row>
      <cell>1</cell>
      <cell>2</cell>
    </row>
    <row>
      <cell>3</cell>
      <cell>4</cell>
    </row>
  </data>
</sheet>`
)

testImport('simple/simple.csv', 'simple/simple.sheet', { header: false })
