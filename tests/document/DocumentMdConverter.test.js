const DocumentMdConverter = require('../../src/document/DocumentMdConverter')
const helpers = require('../helpers')

const converter = new DocumentMdConverter()
const { testLoad, testImport, testExport } = helpers(converter, 'document')

testLoad(
'DocumentMdConverter.load paragraphs',
`
Paragraph 1

Paragraph 2
`,
`<p>Paragraph 1</p>
<p>Paragraph 2</p>
`,
{ eol: 'lf' }
)

testLoad(
'DocumentMdConverter.load heading',
`
Heading
=======

Paragraph
`,
`<sec>
  <title>Heading</title>
  <p>Paragraph</p>
</sec>
`,
{ eol: 'lf' }
)

testLoad(
'DocumentMdConverter.load subheading',
`
Heading 1
=========

Heading 2
---------

Paragraph
`,
`<sec>
  <title>Heading 1</title>
  <sec>
    <title>Heading 2</title>
    <p>Paragraph</p>
  </sec>
</sec>
`,
{ eol: 'lf' }
)

testLoad(
'DocumentMdConverter.load link',
`
[link](https://stenci.la/)
`,
`<p><ext-link ext-link-type="uri" xlink:href="https://stenci.la/">link</ext-link></p>
`,
{ eol: 'lf' }
)

testLoad(
'DocumentMdConverter.load figure',
`
::: {#fig .fig}
::: {.caption}
###### Title

Caption
:::

![](fig.jpg)
:::
`,
`<fig id="fig">
  <caption>
    <title>Title</title>
    <p>Caption</p>
  </caption>
  <graphic mimetype="image" mime-subtype="jpeg" xlink:href="fig.jpg" />
</fig>
`,
{ eol: 'lf' }
)

testLoad(
'DocumentMdConverter.load table',
`
::: {#table .table-wrap}
::: {.caption}
###### Title

Caption
:::

| **Col1** | **Col2** |
|----------|----------|
| Val1     | Val2     |
:::`,
`<table-wrap id="table">
  <caption>
    <title>Title</title>
    <p>Caption</p>
  </caption>
  <table>
    <col align="left" />
    <col align="left" />
    <thead>
      <tr>
        <th><bold role="strong">Col1</bold></th>
        <th><bold role="strong">Col2</bold></th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Val1</td>
        <td>Val2</td>
      </tr>
    </tbody>
  </table>
</table-wrap>
`,
{ eol: 'lf' }
)

testImport('paragraph/md/paragraph-import.md', 'paragraph/stencila/paragraph.jats.xml')
testExport('paragraph/stencila/paragraph.jats.xml', 'paragraph/md/paragraph-export.md')

testImport('heading/md/heading-import.md', 'heading/stencila/heading.jats.xml')
testExport('heading/stencila/heading.jats.xml', 'heading/md/heading-export.md')
