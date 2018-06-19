const {testAsync} = require('./helpers')

const {match} = require('../src')

testAsync('match', async assert => {
  assert.equal((await match('file.edf.json')).constructor.name, 'EDFConverter', 'using path')
  assert.equal((await match('file.foo', null, 'edf')).constructor.name, 'EDFConverter', 'using format')

  assert.equal(await match('file.foo'), null)
  assert.equal(await match('file.edf', null, 'foo'), null)

  assert.end()
})
