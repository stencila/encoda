import * as stencila from '@stencila/schema'
import { DateCodec } from '.'

const dateCodec = new DateCodec()

test('decode', async () => {
  // Valid ISO dates, explicitly or assumed to be UTC
  for (const value of [
    '1990',
    '1990-01',
    '1990-01-01',
    '1990-01-01T00',
    '1990-01-01T00:00',
    '1990-01-01T00:00:00',
    '1990-01-01T00:00:00.000'
  ]) {
    expect(await dateCodec.load(value)).toEqual(stencila.date({ value }))
  }

  // Non-ISO dates
  expect(await dateCodec.load('3 Jan 2004')).toEqual(
    stencila.date({ value: '2004-01-03' })
  )
  expect(await dateCodec.load('1/3/2004')).toEqual(
    stencila.date({ value: '2004-01-03' })
  )
})

test('encode', async () => {
  for (const value of [
    '1990',
    '1990-01',
    '1990-01-01',
    '1990-01-01T00',
    '1990-01-01T00:00',
    '1990-01-01T00:00:00',
    '1990-01-01T00:00:00.000'
  ]) {
    expect(await dateCodec.dump(stencila.date({ value }))).toEqual(value)
  }
})
