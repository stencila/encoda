import { PugCodec } from '.'
import { JsonCodec } from '../json'
import { fixture, snapshot } from '../../__tests__/helpers'

const pug = new PugCodec()
const json = new JsonCodec()

/**
 * Decode a Pug fixture to JSON
 */
const decode2json = async (path: string) =>
  await json.dump(await pug.read(fixture(path)))

/**
 * Encode a JSON fixture to HTML using a Pug template
 */
const encode2html = async (data: string, template: string) =>
  await pug.dump(await json.read(fixture(data)), {template: fixture(template), theme: 'stencila'})

test('decode', async () => {
  expect(await decode2json('simple.pug')).toMatchFile(snapshot('simple.json'))
})

test('encode', async () => {
  expect(await encode2html('article-one.json', 'article-template.pug')).toMatchFile(snapshot('article-one.html'))
  expect(await encode2html('article-empty.json', 'article-template.pug')).toMatchFile(snapshot('article-empty.html'))
})
