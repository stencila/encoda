import { Datatable, Person } from '@stencila/schema'
import nock from 'nock'
import { HTTP } from '.'
import { load } from '../../util/vfile'

const { sniff, decode, encode } = new HTTP()

test('sniff', async () => {
  expect(await sniff('http://example.com')).toBe(true)
  expect(await sniff('https://example.com')).toBe(true)
  expect(await sniff('http')).toBe(false)
  expect(await sniff(' https://example.com')).toBe(false)
  expect(await sniff('foo bar')).toBe(false)
})

describe('decode', () => {
  it('decodes based on Content-Type', async () => {
    nock('http://example.org')
      .get('/data.json')
      .reply(200, '{"type": "Person", "name": "Jane"}', {
        'Content-Type': 'application/json'
      })

    const node1 = await decode(await load('http://example.org/data.json'))
    const person = node1 as Person
    expect(person.type).toBe('Person')
    expect(person.name).toBe('Jane')

    nock('http://example.org')
      .get('/data.csv')
      .reply(200, 'A,B,C\n1,2,3\n4,5,6', { 'Content-Type': 'text/csv' })

    const node2 = await decode(await load('http://example.org/data.csv'))
    const dt = node2 as Datatable
    expect(dt.type).toBe('Datatable')
    expect(dt.columns.length).toBe(3)
  })
})

test('encode', async () => {
  // @ts-ignore
  await expect(encode(null)).rejects.toThrow(/^Unable/)
})
