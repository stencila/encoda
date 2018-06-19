const memfs = require('memfs')
const {testAsync} = require('./helpers')

const {convert} = require('../src')

testAsync('convert: same format', async assert => {
  const volume = new memfs.Volume()
  const file1 = '{\n  "type": "Document",\n  "body": []\n}'
  volume.writeFileSync('/file1.edf.json', file1)
  await convert('/file1.edf.json', '/file2.edf.json', volume)
  let file2 = volume.readFileSync('/file2.edf.json', 'utf8')
  assert.equal(file1, file2)

  assert.end()
})
