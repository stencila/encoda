const {testAsync} = require('./helpers')

const EDFConverter = require('../src/EDFConverter')
const converter = new EDFConverter()

testAsync('EDFConverter.match', async assert => {
  assert.equal(converter.match(null, null, 'edf'), true)
  assert.equal(converter.match('file.edf.json'), true)
  assert.equal(converter.match('folder.edf'), true)
  assert.equal(converter.match('file.foo'), false)

  assert.end()
})

testAsync('EDFConverter.load', async assert => {
  let json = JSON.stringify(testDoc)
  let exedoc = await converter.load(json)
  assert.deepEqual(exedoc, testDoc)

  assert.end()
})

testAsync('EDFConverter.dump', async assert => {
  let json = await converter.dump(testDoc)
  let exedoc = JSON.parse(json)
  assert.deepEqual(exedoc, testDoc)

  assert.end()
})

testAsync('EDFConverter.round', async assert => {
  let exedoc = await converter.round(testDoc)
  assert.deepEqual(exedoc, testDoc)

  assert.end()
})

const testDoc = {
  type: 'Document',
  nodes: []
}
