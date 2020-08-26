import path from 'path'
import { JatsCodec } from '.'
import { convert } from '../..'
import { snapshot } from '../../__tests__/helpers'
import {
  asciimathFragment,
  texFragment,
  mathmlFragment,
  texBlock,
} from '../../__fixtures__/math/kitchen-sink'
import { YamlCodec } from '../yaml'
import { unlinkFiles } from '../../util/media/unlinkFiles'
import { Article, organization, contactPoint } from '@stencila/schema'

const jats = new JatsCodec()
const yaml = new YamlCodec()

const { sniff } = jats

const fixture = (name: string) =>
  path.join(__dirname, '__fixtures__', name, 'main.jats.xml')

jest.mock('crypto')

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

describe('encode: Math', () => {
  it('encodes TeX nodes using <tex-math>', async () => {
    expect(await jats.dump(texFragment, { isStandalone: false })).toMatchFile(
      snapshot('math-tex-fragment.jats.xml')
    )
  })
  it('encodes AsciiMath using <mml:math>', async () => {
    expect(
      await jats.dump(asciimathFragment, { isStandalone: false })
    ).toMatchFile(snapshot('math-asciimath-fragment.jats.xml'))
  })
  it('encodes MathML using <mml:math>', async () => {
    expect(
      await jats.dump(mathmlFragment, { isStandalone: false })
    ).toMatchFile(snapshot('math-mathml-fragment.jats.xml'))
  })
  it('encodes MathBlocks using <display-formula>', async () => {
    expect(await jats.dump(texBlock, { isStandalone: false })).toMatchFile(
      snapshot('math-tex-block.jats.xml')
    )
  })
})

test.each([
  'elife-30274-v1',
  'elife-46472-v3',
  'elife-46793-v1',
  'elife-52882-v2',
  'f1000-7-1655-v1',
  'f1000-8-978-v1',
  'f1000-8-1394-v1',
  'plosone-0091296',
  'plosone-0093988',
  'plosone-0178565',
  'ijm-00202',
])('decode + encode : %s', async (article) => {
  const node = unlinkFiles(await jats.read(fixture(article)))

  expect(await yaml.dump(node)).toMatchFile(snapshot(`${article}.yaml`))

  expect(
    await jats.dump(node, {
      isStandalone: true,
    })
  ).toMatchFile(snapshot(`${article}.jats.xml`))
})

describe('authors', () => {
  test('decode collaborators', async () => {
    const { authors } = unlinkFiles(
      await jats.read(fixture('elife-30274-v1'))
    ) as Article

    expect(authors).toEqual(
      expect.arrayContaining([
        expect.objectContaining(
          organization({
            name: 'Reproducibility Project: Cancer Biology',
            contactPoints: [
              contactPoint({
                emails: ['tim@cos.io', 'nicole@scienceexchange.com'],
              }),
            ],
          })
        ),
      ])
    )
  })
})
