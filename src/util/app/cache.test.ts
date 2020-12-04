import cache from './cache'

test('cache', () => {
  cache.set('key1', 'value1')
  expect(cache.get('key1')).toBe('value1')

  cache.delete('key1')
  expect(cache.get('key1')).toBeUndefined()

  cache.set('key2', 'value2')
  cache.clear()
  expect(cache.get('key2')).toBeUndefined()
})
