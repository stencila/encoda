import fs from 'fs-extra'
import { RnbCodec } from '.'
import { fixture, readFixture, snapshot } from '../../__tests__/helpers'

const { sniff, decode, encode } = new RnbCodec()

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
  const rnb2json = async (filename: string): Promise<string> =>
    JSON.stringify(await decode(await readFixture(filename)), null, '  ')

  test('it matches kitchensink.json snapshot', async () => {
    expect(await rnb2json('kitchensink.nb.html')).toMatchFile(
      snapshot('kitchensink.json')
    )
  })
})

describe('encode', () => {
  test('it throws an exception', async () => {
    await expect(encode()).rejects.toThrow(
      /Encoding to a R Notebook is not yet implemented/
    )
  })
})
