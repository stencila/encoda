import fs from 'fs-extra'
import { RnbCodec } from '.'
import { fixture, readFixture, snapshot } from '../../__tests__/helpers'
import { JsonCodec } from '../json';

const { sniff, decode, encode } = new RnbCodec()

const jsonCodec = new JsonCodec()
const rnb2json = async (filename: string): Promise<string> =>
  jsonCodec.dump(await decode(await readFixture(filename)))

describe('sniff', () => {
  test('it is true for a R Notebook', async () => {
    expect(await sniff(fixture('kitchensink.nb.html'))).toBe(true)
  })

  test('it is false for other file types', async () => {
    expect(await sniff(fixture('kitchensink.Rmd'))).toBe(false)
    expect(await sniff(__filename)).toBe(false)
  })

  test('it is true for R Notebook content', async () => {
    expect(
      await sniff(await fs.readFile(fixture('kitchensink.nb.html'), 'utf8'))
    ).toBe(true)
  })

  test('it is false for other content', async () => {
    expect(await sniff('Yo, Im just some other content!')).toBe(false)
  })
})

describe('decode', () => {
  test('it matches kitchensink.json snapshot', async () => {
    expect(await rnb2json('kitchensink.nb.html')).toMatchFile(
      snapshot('kitchensink.json')
    )
  })
})

describe('encode', () => {
  test('it throws an exception', async () => {
    expect(() => encode()).toThrow(
      /Encoding to a R Notebook is not yet implemented/
    )
  })
})
