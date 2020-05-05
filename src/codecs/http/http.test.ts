import { Datatable, Person } from '@stencila/schema'
import nock from 'nock'
import { HTTPCodec } from '.'
import { load } from '../../util/vfile'

const { sniff, decode, encode } = new HTTPCodec()

test('sniff', async () => {
  expect(await sniff('http://example.com')).toBe(true)
  expect(await sniff('https://example.com')).toBe(true)
  expect(await sniff('http')).toBe(false)
  expect(await sniff(' https://example.com')).toBe(false)
  expect(await sniff('foo bar')).toBe(false)
})

describe('decode', () => {
  it('decodes based on Content-Type if that is not text/plain', async () => {
    nock('http://example.org')
      .get('/data.json')
      .reply(200, '{"type": "Person", "name": "Jane"}', {
        'Content-Type': 'application/json',
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

  it('decodes based on filename extension if Content-Type is text/plain or missing', async () => {
    nock('http://example.org')
      .get('/data.csv')
      .reply(200, 'A,B,C\n1,2,3\n4,5,6')

    const node = await decode(await load('http://example.org/data.csv'))
    const dt = node as Datatable
    expect(dt.type).toBe('Datatable')
    expect(dt.columns.length).toBe(3)
  })
})

test('encode', async () => {
  expect(() => encode()).toThrow(/^Unable/)
})
