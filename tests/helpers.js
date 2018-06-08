const test = require('tape')

/**
 * Test an async function
 *
 * A convenience function that provides better
 * handling of errors when testing async functions
 *
 * @param  {String} name Name of test
 * @param  {Function} func Async test function
 */
function testAsync (name, func) {
  test(name, async assert => {
    try {
      await func(assert)
    } catch (error) {
      assert.fail(error.message)
      console.error(error) // for nicer output of error stack
      assert.end()
    }
  })
}

module.exports = {
  test,
  testAsync
}
