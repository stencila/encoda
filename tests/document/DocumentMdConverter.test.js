const DocumentMdConverter = require('../../src/document/DocumentMdConverter')
const helpers = require('../helpers')

const converter = new DocumentMdConverter()
const { testLoad, testImport, testExport } = helpers(converter, 'document')

testImport('paragraph/md/paragraph-import.md', 'paragraph/stencila/paragraph.jats.xml', {complete: false})
testExport('paragraph/stencila/paragraph.jats.xml', 'paragraph/md/paragraph-export.md', {complete: false})

testImport('inlines/md/inlines-import.md', 'inlines/stencila/inlines.jats.xml', {complete: false})
testExport('inlines/stencila/inlines.jats.xml', 'inlines/md/inlines-export.md', {complete: false})

testImport('heading/md/heading-import.md', 'heading/stencila/heading.jats.xml', {complete: false})
testExport('heading/stencila/heading.jats.xml', 'heading/md/heading-export.md', {complete: false})


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
