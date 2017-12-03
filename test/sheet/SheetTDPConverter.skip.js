import test from 'tape'

import SheetTDPConverter from '../../src/sheet/SheetTDPConverter'
import MemoryStorer from '../../src/host/MemoryStorer'

test('SheetTDPConverter:match', t => {
  let c = new SheetTDPConverter()

  let storer1 = new MemoryStorer({
    'datapackage.json': '{}',
    'data.csv': 'col1,col2\n1,2\n3,4\n'
  })

  let storer2 = new MemoryStorer({
    'data.csv': 'col1,col2\n1,2\n3,4\n'
  })

  t.plan(4)

  c.match('datapackage.json', storer1).then(result => {
    t.ok(result)
  })

  c.match('not-a-data-package.json', storer1).then(result => {
    t.notOk(result)
  })

  c.match('data.csv', storer1).then(result => {
    t.ok(result)
  }, 'has a sibling datapackage.json')

  c.match('data.csv', storer2).then(result => {
    t.notOk(result)
  }, 'no sibling datapackage.json')
})

test('SheetTDPConverter:import', t => {
  let datapackage = {
    resources: [{
      path: 'data.csv',
      name: 'data-name',
      schema: {
        fields: [
          {
            name: 'col1',
            type: 'string'
          },
          {
            name: 'col2',
            type: 'integer'
          }
        ]
      }
    }]
  }
  let csv = `col1,col2
"a",1
"b",2
"c",3
`
  let xml = `
<sheet>
  <name>data-name</name>
  <fields>
    <field name="col1" title="" description="" type="string" format="" rdfType=""/>
    <field name="col2" title="" description="" type="integer" format="" rdfType=""/>
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

  let c = new SheetTDPConverter()
  let storer = new MemoryStorer({
    'datapackage.json': JSON.stringify(datapackage),
    'data.csv': csv
  })

  let buffer = new MemoryStorer()

  c.import('data.csv', storer, buffer).then(() => {
    buffer.readFile('sheet.xml').then(data => {
      t.equal(data, xml)
      t.end()
    })
  })
})

test('SheetTDPConverter:export', t => {
  let c = new SheetTDPConverter()
  t.throws(c.export, 'SheetTDPConverter.export() not yet implemented')
  t.end()
})
