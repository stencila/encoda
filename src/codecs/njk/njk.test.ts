import { NunjucksCodec } from '.'
import { JsonCodec } from '../json'
import { fixture, snapshot } from '../../__tests__/helpers'

const njk = new NunjucksCodec()
const json = new JsonCodec()

/**
 * Encode a JSON fixture to a chosen format using using a Nunjucks template
 */
const encode2format = async (data: string, format: string, template: string) =>
  await njk.dump(await json.read(fixture(data)), {
    format,
    template: fixture(template),
    theme: 'stencila'
  })

test('decode', async () => {
  expect(await njk.decode()).toMatch('')
})

test('encode', async () => {
  expect(
    await encode2format('article-one.json', 'md', 'article-template.md')
  ).toMatchFile(snapshot('article-one.md'))
  expect(
    await encode2format('article-one.json', 'html', 'article-template.html')
  ).toMatchFile(snapshot('article-one.html'))
})
