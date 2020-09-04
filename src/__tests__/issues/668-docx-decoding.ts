import path from 'path'
import { DocxCodec } from '../../codecs/docx'
import { MdCodec } from '../../codecs/md'
import { YamlCodec } from '../../codecs/yaml'
import { snapshot } from '../../__tests__/helpers'
/**
 * See https://github.com/stencila/encoda/issues/668
 *
 * The issue concerns DOC to IPYNB conversion but this test generates
 * a Markdown snapshot because the generated IPYNB is mostly Markdown
 * in this case anyway, because Markdown is easier to read, and because
 * the fix for this issue resulted in a downstream fix to the `md` codec.
 *
 * Also generates a YAML snapshot primarily for debugging.
 */
test('issue 668: decoding a DOCX', async () => {
  const doc = await new DocxCodec().read(
    path.join(__dirname, '668-CfRadialDoc-v2.1-20190901.docx')
  )
  expect(await new YamlCodec().dump(doc)).toMatchFile(
    snapshot('668-CfRadialDoc-v2.1-20190901.yaml')
  )
  expect(await new MdCodec().dump(doc)).toMatchFile(
    snapshot('668-CfRadialDoc-v2.1-20190901.md')
  )
})
