const {testAsync} = require('./helpers')

const {match} = require('../src')

testAsync('match', async assert => {
  assert.equal((await match('file.json')).constructor.name, 'JSONConverter', 'using path')
  assert.equal((await match('file.foo', null, 'json')).constructor.name, 'JSONConverter', 'using format')

  assert.equal(await match('file.foo'), null, 'should throw')
  assert.equal(await match('file.json', null, 'foo'), null)

  assert.end()
})
