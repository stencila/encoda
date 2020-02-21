import * as cli from './cli'

/**
 * Currently, this test does not do much.
 * However, by simply importing the `cli` module
 * it will catch errors picked up by the Typescript compiler
 * which are otherwise not.
 */
test('cli', () => {
  expect(cli).toBeDefined()
})
