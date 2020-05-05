import { fixture, output } from '../../__tests__/helpers'
import { PdfCodec } from '.'
import * as stencila from '@stencila/schema'
import { MdCodec } from '../md'

const mdCodec = new MdCodec()
const pdfCodec = new PdfCodec()

describe('decode', () => {
  test('meta data from info dict', async () => {
    const { title, authors, keywords, dateCreated } = (await pdfCodec.read(
      fixture('external.pdf')
    )) as stencila.CreativeWork
    expect(title).toEqual(
      'Test reading meta data from an externally created PDF'
    )
    expect(authors).toEqual([
      stencila.person({ givenNames: ['Nokome'], familyNames: ['Bentley'] }),
    ])
    expect(keywords).toEqual(['test', 'pdf', 'externally', 'created'])
    expect(dateCreated).toEqual(
      stencila.date({ value: '2019-10-13T11:00:00.000Z' })
    )
  })
})

describe('round-trip', () => {
  test('kitchen-sink', async () => {
    const expected = await mdCodec.read(fixture('kitchen-sink.md'))
    await pdfCodec.write(expected, output('kitchen-sink.pdf'))
    const actual = await pdfCodec.read(output('kitchen-sink.pdf'))
    expect(actual).toEqual(expected)
  })
})
