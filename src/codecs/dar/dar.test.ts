import fs from 'fs-extra'
import globby from 'globby'
import path from 'path'
import { DarCodec } from '.'
import flat from '../../__fixtures__/collection/flat'
import mixed from '../../__fixtures__/collection/mixed'
import { defaultEncodeOptions } from '../types'

const { decode, encode, sniff } = new DarCodec()

jest.setTimeout(30 * 1000)

const empty = path.join(__dirname, '__fixtures__', 'empty.dar')

// Create an output DAR name and remove it if it already exists
const outdir = async (name: string) => {
  const dir = path.join(__dirname, '__outputs__', name)
  await fs.remove(dir)
  return dir
}
// Read the manifest from a DAR directory
const manifest = async (dir: string) =>
  await fs.readFile(path.join(dir, 'manifest.xml'), 'utf-8')
// Get a sorted list of files from a DAR directory
const files = async (dir: string) => (await globby('**/*', { cwd: dir })).sort()

test('sniff', async () => {
  expect(await sniff(empty)).toBe(true)

  expect(await sniff(__dirname)).toBe(false)
  expect(await sniff(__filename)).toBe(false)
  expect(await sniff('foo bar')).toBe(false)
})

describe('decode', () => {
  it('does not work yet', async () => {
    expect(() => decode()).toThrow(/TODO: Not yet implemented/)
  })
})

// These encoding tests only test the file names
// and the content of `manifest.xml` since the content
// of other files is (should be) covered by other tests

describe('encode', () => {
  it('works on flat collection', async () => {
    const dir = await outdir('flat.dar')

    await encode(flat, { ...defaultEncodeOptions, filePath: dir })

    expect(await files(dir)).toEqual([
      'manifest.xml',
      'one.jats.xml',
      'three.jats.xml',
      'two.jats.xml'
    ])
    expect(await manifest(dir)).toMatchSnapshot()
  })

  it('works on mixed collection', async () => {
    const dir = await outdir('mixed.dar')

    await encode(mixed, { ...defaultEncodeOptions, filePath: dir })

    expect(await files(dir)).toEqual([
      'manifest.xml',
      'one.jats.xml',
      'three.jats.xml',
      'two.csv'
    ])
    expect(await manifest(dir)).toMatchSnapshot()
  })

  it('works with multiple media asset protocols', async () => {
    const dir = await outdir('media-protocols.dar')

    await encode(
      {
        type: 'CreativeWork',
        content: [
          {
            type: 'MediaObject',
            contentUrl:
              'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=='
          },
          {
            type: 'MediaObject',
            contentUrl: path.join(__dirname, '__fixtures__', 'red-dot.png')
          }
        ]
      },
      { ...defaultEncodeOptions, filePath: dir }
    )

    expect(await manifest(dir)).toMatchSnapshot()
  })
})
