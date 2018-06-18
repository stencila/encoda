const {testAsync} = require('./helpers')

const SheetConverter = require('../src/SheetConverter')
const converter = new SheetConverter()

testAsync('SheetConverter.load', async assert => {
  let exedoc

  exedoc = await converter.load(JSON.stringify(testCSF))
  assert.deepEqual(exedoc, testExedoc)

  exedoc = await converter.load(testCSV, {from: 'csv'})
  assert.deepEqual(exedoc.body, testExedoc.body)

  assert.end()
})

testAsync('SheetConverter.dump', async assert => {
  let csf = await converter.dump(testExedoc)
  assert.deepEqual(JSON.parse(csf), testCSF)

  let csv = await converter.dump(testExedoc, {to: 'csv'})
  assert.deepEqual(csv, testCSV)

  assert.end()
})

testAsync('SheetConverter.round', async assert => {
  let exedoc = await converter.round(testExedoc)
  assert.deepEqual(exedoc, testExedoc)

  assert.end()
})

const testCSV = `a1,1
a2,2
`

const testCSF = {
  SheetNames: ['my-sheet'],
  Sheets: {
    'my-sheet': {
      '!ref': 'A1:B2',
      A1: {t: 's', v: 'a1'},
      A2: {t: 's', v: 'a2'},
      B1: {t: 'n', v: 1},
      B2: {t: 'n', v: 2}
    }
  }
}

const testExedoc = {
  type: 'Document',
  front: {
    name: {
      type: 'String',
      data: 'my-sheet'
    }
  },
  body: [
    {
      type: 'Table',
      rows: [
        [
          [{
            type: 'String',
            data: 'a1'
          }],
          [{
            type: 'Number',
            data: 1
          }]
        ], [
          [{
            type: 'String',
            data: 'a2'
          }],
          [{
            type: 'Number',
            data: 2
          }]
        ]
      ]
    }
  ]
}
