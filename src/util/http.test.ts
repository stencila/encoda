import delay from 'delay'
import nock from 'nock'
import { get, cacheDelete } from './http'

describe('get', () => {
  it('will cache responses if caching headers are set', async () => {
    nock('https://example.org')
      .get('/cached')
      .reply(200, 'OK', {
        'cache-control': 'max-age=60'
      })

    // Ensure that there is no cached value from the
    // previous test
    await cacheDelete('https://example.org/cached')

    let response = await get('https://example.org/cached')
    expect(response.fromCache).toBe(false)

    // Wait 10s to allow the cache file to be written
    await delay(10)

    response = await get('https://example.org/cached')
    expect(response.fromCache).toBe(true)
  })

  it('will not cache responses if no caching headers are set', async () => {
    nock('https://example.org')
      .get('/not-cached')
      .reply(200, 'OK')
      .persist() // Persist so that this can be called twice

    let response = await get('https://example.org/not-cached')
    expect(response.fromCache).toBe(false)
    response = await get('https://example.org/not-cached')
    expect(response.fromCache).toBe(false)
  })
})
