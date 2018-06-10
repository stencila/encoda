const {testAsync} = require('./helpers')

const {match} = require('../src')

testAsync('match', async assert => {
  assert.equal((await match('file.json')).constructor.name, 'JSONConverter', 'using path')
  assert.equal((await match('file.foo', null, 'json')).constructor.name, 'JSONConverter', 'using format')

  try {
    await match('file.foo')
    assert.fail('should throw')
  } catch (error) {
    assert.equal(error.message, 'No converter for path "file.foo"')
  }

  try {
    await match('file.json', null, 'foo')
    assert.fail('should throw')
  } catch (error) {
    assert.equal(error.message, 'No converter for format "foo"')
  }

  assert.end()
})
