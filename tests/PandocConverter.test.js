const {testAsync} = require('./helpers')

const PandocConverter = require('../src/PandocConverter')
const converter = new PandocConverter()

testAsync('PandocConverter.load', async assert => {
  let pandocJson = JSON.stringify(testPandoc)
  let doc = await converter.load(pandocJson)
  assert.deepEqual(doc, testDoc)

  assert.end()
})

testAsync('PandocConverter.dump', async assert => {
  let pandocJson = await converter.dump(testDoc)
  const pandocDoc = JSON.parse(pandocJson)
  assert.deepEqual(pandocDoc.blocks, testPandoc.blocks)

  assert.end()
})

testAsync('PandocConverter.round', async assert => {
  let doc = await converter.round(testDoc)
  assert.deepEqual(doc, testDoc)

  assert.end()
})

const testDoc = {
  type: 'Document',
  body: [
    {
      type: 'Para',
      nodes: [
        {
          type: 'String',
          data: 'Hello'
        }
      ]
    }
  ]
}

const testPandoc = {
  'pandoc-api-version': [1, 17, 3],
  meta: {},
  blocks: [
    {
      t: 'Para',
      c: [
        {
          t: 'Str',
          c: 'Hello'
        }
      ]
    }
  ]
}
