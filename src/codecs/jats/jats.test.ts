import { toMatchFile } from 'jest-file-snapshot'
import path from 'path'
import { JatsCodec } from '.'
import { convert } from '../..'
import { snapshot } from '../../__tests__/helpers'

const { sniff } = new JatsCodec()

/**
 * This test suite uses fixtures and file snapshots. During development
 * it can be useful to update the snapshots on the fly for manual inspection:
 *
 * ```bash
 * npx jest codecs/jats/jats.test.ts --watch --updateSnapshot
 * ```
 */

const fixture = (name: string) =>
  path.join(__dirname, '__fixtures__', name, 'main.jats.xml')

test('sniff', async () => {
  expect(
    await sniff(
      '<!DOCTYPE article PUBLIC "-//NLM//DTD JATS (Z39.96) Journal Archiving and Interchange DTD v1.1 20151215//EN"'
    )
  ).toBe(true)
  expect(
    await sniff(
      '<!DOCTYPE article PUBLIC "-//NLM//DTD JATS (Z39.96) Journal Publishing DTD v1.2 20190208//EN"'
    )
  ).toBe(true)
  expect(
    await sniff(
      '<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE article\n\tPUBLIC\n  "-//NLM//DTD JATS (Z39.96) Blah blah'
    )
  ).toBe(true)

  expect(await sniff(fixture('elife-46793-v1'))).toBe(true)
  expect(await sniff(fixture('f1000-7-1655-v1'))).toBe(true)
  expect(await sniff(fixture('plosone-0091296'))).toBe(true)

  expect(await sniff('foo bar')).toBe(false)
  expect(await sniff(__dirname)).toBe(false)
  expect(await sniff(path.join(__dirname, 'README.md'))).toBe(false)
})

test('decode', async () => {
  /**
   * Decode fixtures to YAML snapshot files (for readability)
   */
  const jats2yaml = async (name: string) =>
    convert(fixture(name), undefined, { from: 'jats', to: 'yaml' })

  expect(await jats2yaml('elife-30274-v1')).toMatchFile(
    snapshot('elife-30274-v1.yaml')
  )
  expect(await jats2yaml('elife-46472-v3')).toMatchFile(
    snapshot('elife-46472-v3.yaml')
  )
  expect(await jats2yaml('elife-46793-v1')).toMatchFile(
    snapshot('elife-46793-v1.yaml')
  )
  expect(await jats2yaml('elife-52882-v2')).toMatchFile(
    snapshot('elife-52882-v2.yaml')
  )

  expect(await jats2yaml('f1000-7-1655-v1')).toMatchFile(
    snapshot('f1000-7-1655-v1.yaml')
  )
  expect(await jats2yaml('f1000-8-978-v1')).toMatchFile(
    snapshot('f1000-8-978-v1.yaml')
  )
  expect(await jats2yaml('f1000-8-1394-v1')).toMatchFile(
    snapshot('f1000-8-1394-v1.yaml')
  )

  expect(await jats2yaml('plosone-0091296')).toMatchFile(
    snapshot('plosone-0091296.yaml')
  )
  expect(await jats2yaml('plosone-0093988')).toMatchFile(
    snapshot('plosone-0093988.yaml')
  )
  expect(await jats2yaml('plosone-0178565')).toMatchFile(
    snapshot('plosone-0178565.yaml')
  )
})

test('decode+encode', async () => {
  /**
   * Round trip conversion from JATS to JATS
   */
  const jats2jats = async (name: string) =>
    convert(fixture(name), undefined, { from: 'jats', to: 'jats' })

  expect(await jats2jats('elife-30274-v1')).toMatchFile(
    snapshot('elife-30274-v1.jats.xml')
  )
  expect(await jats2jats('elife-46472-v3')).toMatchFile(
    snapshot('elife-46472-v3.jats.xml')
  )
  expect(await jats2jats('elife-46793-v1')).toMatchFile(
    snapshot('elife-46793-v1.jats.xml')
  )
  expect(await jats2jats('elife-52882-v2')).toMatchFile(
    snapshot('elife-52882-v2.jats.xml')
  )

  expect(await jats2jats('f1000-7-1655-v1')).toMatchFile(
    snapshot('f1000-7-1655-v1.jats.xml')
  )
  expect(await jats2jats('f1000-8-978-v1')).toMatchFile(
    snapshot('f1000-8-978-v1.jats.xml')
  )
  expect(await jats2jats('f1000-8-1394-v1')).toMatchFile(
    snapshot('f1000-8-1394-v1.jats.xml')
  )

  expect(await jats2jats('plosone-0091296')).toMatchFile(
    snapshot('plosone-0091296.jats.xml')
  )
  expect(await jats2jats('plosone-0093988')).toMatchFile(
    snapshot('plosone-0093988.jats.xml')
  )
  expect(await jats2jats('plosone-0178565')).toMatchFile(
    snapshot('plosone-0178565.jats.xml')
  )
})
