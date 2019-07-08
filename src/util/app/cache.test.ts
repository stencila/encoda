import cache from './cache'
import fs from 'fs-extra'

test('cache', async () => {
  await cache.set('key1', 'value1')
  expect(await cache.get('key1')).toBe('value1')
})
