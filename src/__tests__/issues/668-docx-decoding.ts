import path from 'path'
import { DocxCodec } from '../../codecs/docx'

/**
 * See https://github.com/stencila/encoda/issues/668
 */
test('issue 668: decoding a DOCX', async () => {
  const docxCodec = new DocxCodec()

  await docxCodec.read(
    path.join(__dirname, '668-CfRadialDoc-v2.1-20190901.docx')
  )
})
