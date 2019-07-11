// @ts-ignore
import path from 'path'
import { sniff } from '.'
import { convert } from '../..'

/**
 * This test suite uses fixtures and file snapshots. During development
 * it can be useful to update the snapshots on the fly for manual inspection:
 *
 * ```bash
 * npx jest codecs/jats/jats.test.ts --watch --updateSnapshot
 * ```
 */

const fixture = (name: string) => path.join(__dirname, '__fixtures__', name)
const snapshot = (name: string) =>
  path.join(__dirname, '__file_snapshots__', name)

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
  expect(await sniff(fixture('elife-46793-v1.xml'))).toBe(true)
  expect(await sniff(fixture('f1000research-7-1655-v1.xml'))).toBe(true)

  expect(await sniff('foo bar')).toBe(false)
  expect(await sniff(__dirname)).toBe(false)
  expect(await sniff(fixture('README.md'))).toBe(false)
})

test('decode', async () => {
  /**
   * Decode fixtures to YAML snapshot files (for readability)
   */
  const yaml = async (name: string) =>
    convert(fixture(name), undefined, { from: 'jats', to: 'yaml' })

  expect(await yaml('elife-30274-v1.xml')).toMatchFile(
    snapshot('elife-30274-v1.yaml')
  )
  expect(await yaml('elife-46472-v1.xml')).toMatchFile(
    snapshot('elife-46472-v1.yaml')
  )
  expect(await yaml('elife-46793-v1.xml')).toMatchFile(
    snapshot('elife-46793-v1.yaml')
  )

  expect(await yaml('f1000research-7-1655-v1.xml')).toMatchFile(
    snapshot('f1000research-7-1655-v1.yaml')
  )
  expect(await yaml('f1000research-8-978-v1.xml')).toMatchFile(
    snapshot('f1000research-8-978-v1.yaml')
  )
  expect(await yaml('f1000research-8-1008-v1.xml')).toMatchFile(
    snapshot('f1000research-8-1008-v1.yaml')
  )
})

test('decode+encode', async () => {
  /**
   * Round trip conversion from JATS to JATS
   */
  const jats = async (name: string) =>
    convert(fixture(name), undefined, { from: 'jats', to: 'jats' })

  expect(await jats('elife-30274-v1.xml')).toMatchFile(
    snapshot('elife-30274-v1.jats.xml')
  )
  expect(await jats('elife-46472-v1.xml')).toMatchFile(
    snapshot('elife-46472-v1.jats.xml')
  )
  expect(await jats('elife-46793-v1.xml')).toMatchFile(
    snapshot('elife-46793-v1.jats.xml')
  )

  expect(await jats('f1000research-7-1655-v1.xml')).toMatchFile(
    snapshot('f1000research-7-1655-v1.jats.xml')
  )
  expect(await jats('f1000research-8-978-v1.xml')).toMatchFile(
    snapshot('f1000research-8-978-v1.jats.xml')
  )
  expect(await jats('f1000research-8-1008-v1.xml')).toMatchFile(
    snapshot('f1000research-8-1008-v1.jats.xml')
  )
})
