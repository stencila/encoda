import test from 'tape'

import DocumentMarkdownConverter from '../../src/document/DocumentMarkdownConverter'

const converter = new DocumentMarkdownConverter()

function testLoad(name, md, xml) {
  test(name, (assert) => {
    converter.load(md).then((result) => {
      assert.equal(result.trim(), xml.trim())
      assert.end()
    }).catch((error) => {
      assert.fail(error)
      assert.end()
    })
  })
}


testLoad(
'DocumentMarkdownConverter.load paragraphs',
`
Paragraph 1

Paragraph2
`,
`
<p>Paragraph1</p>
<p>Paragraph2</p>
`
)

