const {testAsync} = require('./helpers')

const JSONConverter = require('../src/JSONConverter')
const converter = new JSONConverter()

testAsync('JSONConverter.match', async assert => {
  assert.equal(converter.match(null, null, 'json'), true)
  assert.equal(converter.match('file.json'), true)
  assert.equal(converter.match('file.foo'), false)

  assert.end()
})

testAsync('JSONConverter.load', async assert => {
  let json = JSON.stringify(testDoc)
  let doc = await converter.load(json)
  assert.deepEqual(doc, testDoc)

  assert.end()
})

testAsync('JSONConverter.dump', async assert => {
  let json = await converter.dump(testDoc)
  let doc = JSON.parse(json)
  assert.deepEqual(doc, testDoc)

  assert.end()
})

testAsync('JSONConverter.round', async assert => {
  let doc = await converter.round(testDoc)
  assert.deepEqual(doc, testDoc)

  assert.end()
})

const testDoc = {
  type: 'Document',
  nodes: []
}
