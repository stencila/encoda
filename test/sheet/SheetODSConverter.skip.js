import test from 'tape'

import SheetODSConverter from '../../src/sheet/SheetODSConverter'
import MemoryStorer from '../../src/host/MemoryStorer'

import fixtures from '../../tmp/test-fixtures'

test('SheetODSConverter:match', t => {
  let c = new SheetODSConverter()

  t.plan(2)

  c.match('data.ods').then(result => {
    t.ok(result)
  }, 'an ODS file')

  c.match('data.csv').then(result => {
    t.notOk(result)
  }, 'not am ODS file')
})

test('SheetODSConverter:import', t => {
  let c = new SheetODSConverter()
  let storer = new MemoryStorer(fixtures)
  let buffer = new MemoryStorer()

  let sheet = `<sheet>
    <fields>
        <field name="field1"/>
        <field name="field2"/>
    </fields>
    <values>
        <row>
            <value>a</value>
            <value>1</value>
        </row>
        <row>
            <value>b</value>
            <value>2</value>
        </row>
        <row>
            <value>c</value>
            <value>3</value>
        </row>
    </values>
</sheet>`.replace(/ {2}|\n/g, '')

  c.import('tests/sheet/fixtures/simple.ods', storer, buffer).then(() => {
    buffer.readFile('sheet.xml').then(content => {
      t.equal(content, sheet)
      t.end()
    })
  }).catch(error => {
    t.error(error)
    t.end()
  })
})

test('SheetODSConverter:_importSheetFromContent', t => {
  // This XML was obtained from a .ods file produced by Open Office
  let content = `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content office:version="1.2">
  <office:scripts/>
  <office:font-face-decls></office:font-face-decls>
  <office:automatic-styles></office:automatic-styles>
  <office:body>
    <office:spreadsheet>
      <table:calculation-settings table:automatic-find-labels="false" />
      <table:table table:name="Sheet1" table:style-name="ta1">
        <table:table-column table:style-name="co1" table:number-columns-repeated="2" table:default-cell-style-name="Default" />
        <table:table-row table:style-name="ro1">
          <table:table-cell office:value-type="string" calcext:value-type="string">
            <text:p>field1</text:p>
          </table:table-cell>
          <table:table-cell office:value-type="string" calcext:value-type="string">
            <text:p>field2</text:p>
          </table:table-cell>
        </table:table-row>
        <table:table-row table:style-name="ro1">
          <table:table-cell office:value-type="string" calcext:value-type="string">
            <text:p>a</text:p>
          </table:table-cell>
          <table:table-cell office:value-type="float" office:value="1" calcext:value-type="float">
            <text:p>1</text:p>
          </table:table-cell>
        </table:table-row>
        <table:table-row table:style-name="ro1">
          <table:table-cell office:value-type="string" calcext:value-type="string">
            <text:p>b</text:p>
          </table:table-cell>
          <table:table-cell office:value-type="float" office:value="2" calcext:value-type="float">
            <text:p>2</text:p>
          </table:table-cell>
        </table:table-row>
        <table:table-row table:style-name="ro1">
          <table:table-cell office:value-type="string" calcext:value-type="string">
            <text:p>c</text:p>
          </table:table-cell>
          <table:table-cell office:value-type="float" office:value="3" calcext:value-type="float">
            <text:p>3</text:p>
          </table:table-cell>
        </table:table-row>
      </table:table>
      <table:named-expressions/>
    </office:spreadsheet>
  </office:body>
</office:document-content>`.replace(/ {2}|\n/g, '')

  let sheet = `<sheet>
  <fields>
    <field name="field1"/>
    <field name="field2"/>
  </fields>
  <values>
    <row>
      <value>a</value>
      <value>1</value>
    </row>
    <row>
      <value>b</value>
      <value>2</value>
    </row>
    <row>
      <value>c</value>
      <value>3</value>
    </row>
  </values>
</sheet>`.replace(/ {2}|\n/g, '')

  let c = new SheetODSConverter()
  t.equal(
    c._importSheetFromContent(content).getOuterHTML(),
    sheet
  )
  t.end()
})

test('SheetODSConverter:export', t => {
  let c = new SheetODSConverter()
  t.throws(c.export, 'SheetODSConverter.export() not yet implemented')
  t.end()
})
