const {testAsync} = require('./helpers')

const {match} = require('../src')
const jsonConverter = require('../src/JSONConverter')

testAsync('match', async assert => {
  assert.equal(await match('file.json'), jsonConverter, 'using path')
  assert.equal(await match('file.foo', null, 'json'), jsonConverter, 'using format')

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
