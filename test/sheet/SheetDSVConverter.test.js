import test from 'tape'
import { Volume } from 'memfs'

import SheetDSVConverter from '../../src/sheet/SheetDSVConverter'

let converter = new SheetDSVConverter()

test('SheetDSVConverter.match', (assert) => {
  let volume = new Volume()

  assert.plan(4)

  converter.match(volume, 'data.csv').then((result) => {
    assert.ok(result)
  }, 'a CSV file')

  converter.match(volume, 'data.tsv').then((result) => {
    assert.ok(result)
  }, 'a TSV file')

  converter.match(volume, 'data.psv').then((result) => {
    assert.ok(result)
  }, 'a PSV file')

  converter.match(volume, 'data.xlsx').then((result) => {
    assert.notOk(result)
  }, 'not a DSV file')
})

function testLoad (name, dsv, xml) {
  test(name, (assert) => {
    converter.load(dsv).then((result) => {
      assert.equal(result.trim(), xml.trim())
      assert.end()
    })
  })
}

testLoad('SheetDSVConverter.load',
`col1,col2
"a",1
"b",2
"c",3
`,
`<sheet>
  <meta>
    <name/>
    <title/>
    <description/>
    <columns>
      <column name="col1" />
      <column name="col2" />
    </columns>
  </meta>
  <data>
    <row>
      <cell>a</cell>
      <cell>1</cell>
    </row>
    <row>
      <cell>b</cell>
      <cell>2</cell>
    </row>
    <row>
      <cell>c</cell>
      <cell>3</cell>
    </row>
  </data>
</sheet>`
)

test('SheetDSVConverter.export', (assert) => {
  let converter = new SheetDSVConverter()
  converter.export().then(() => {
    assert.fail('should fail')
    assert.end()
  }).catch((error) => {
    assert.equal(error.message, 'Not implemented')
    assert.end()
  })
})
