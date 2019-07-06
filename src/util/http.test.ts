import nock from 'nock'
import { get } from './http'

describe('get', () => {
  it('will cache responses if caching headers are set', async () => {
    nock('https://example.org')
      .get('/cached')
      .reply(200, 'OK', {
        'Cache-Control': 'max-age=60'
      })
      .persist()

    let response = await get('https://example.org/cached')
    expect(response.fromCache).toBe(false)
    response = await get('https://example.org/cached')
    expect(response.fromCache).toBe(true)
  })

  it('will not cache responses if no caching headers are set', async () => {
    nock('https://example.org')
      .get('/not-cached')
      .reply(200, 'OK')
      .persist()

    let response = await get('https://example.org/not-cached')
    expect(response.fromCache).toBe(false)
    response = await get('https://example.org/not-cached')
    expect(response.fromCache).toBe(false)
  })
})
