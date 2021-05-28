import { schema } from '@stencila/jesta'
import articleSimple from '../../__fixtures__/article/simple'
import { snapshot } from '../../__tests__/helpers'
import { YamlCodec } from '../yaml'
import { ODTCodec } from './'

const odtCodec = new ODTCodec()
const yamlCodec = new YamlCodec()

test('encode + decode', async () => {
  await odtCodec.write(articleSimple, snapshot('article-simple.odt'))
  const articleRead = (await odtCodec.read(
    snapshot('article-simple.odt')
  )) as schema.Article

  // Pandoc's ODT parser does not detect title style and so the article has a
  // starting paragraph with the title.
  expect(articleRead.title).toBeUndefined()
  expect(await yamlCodec.dump(articleRead)).toMatchFile(
    snapshot('article-simple.yaml')
  )
})
