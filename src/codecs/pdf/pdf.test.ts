import { read, write } from '../..'
import { fixture, output } from '../../__tests__/helpers'
import { PdfCodec } from '.'
import * as stencila from '@stencila/schema'

const pdfCodec = new PdfCodec()

describe('decode', () => {
  test('meta data from info dict', async () => {
    const work = (await read(fixture('external.pdf'))) as stencila.CreativeWork
    expect(work.title).toEqual(
      'Test reading meta data from an externally created PDF'
    )
    expect(work.authors).toEqual([
      stencila.person({ givenNames: ['Nokome'], familyNames: ['Bentley'] })
    ])
    expect(work.keywords).toEqual(['test', 'pdf', 'externally', 'created'])
    expect(work.dateCreated).toEqual(
      stencila.date({ value: '2019-10-13T11:00:00.000Z' })
    )
  })
})

describe('round-trip', () => {
  test('kitchen-sink', async () => {
    const expected = await read(fixture('kitchen-sink.md'))
    await write(expected, output('kitchen-sink.pdf'))
    const actual = await read(output('kitchen-sink.pdf'))
    expect(actual).toEqual(expected)
  })
})
