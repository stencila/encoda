const SheetScriptConverter = require('../../src/sheet/SheetScriptConverter')
const helpers = require('../helpers')

const converter = new SheetScriptConverter()
const { testExportString } = helpers(converter, 'sheet')

testExportString('name',
'index.sheet.xml',
`
<sheet>
  <data>
    <row>
      <cell language="r">2 * 2</cell>
    </row>
  </data>
</sheet>
`,
`
`
)
