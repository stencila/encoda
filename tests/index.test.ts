import { resolve } from '../src'

test('resolve', async () => {
  await expect(resolve('foo.bar')).rejects.toThrow(
    'No compiler could be found for file path "foo.bar".'
  )
})
