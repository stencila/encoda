import DocumentMarkdownConverter from '../../src/document/DocumentMarkdownConverter'
import helpers from '../helpers'

const converter = new DocumentMarkdownConverter()
const { testLoad } = helpers(converter, 'sheet')

testLoad(
'paragraphs',
`
Paragraph 1

Paragraph 2
`,
`<p>
  Paragraph 1
</p>
<p>
  Paragraph 2
</p>
`
)

testLoad(
'heading',
`
Heading
=======

Paragraph
`,
`<sec>
  <title>Heading</title>
  <p>
    Paragraph
  </p>
</sec>
`
)

testLoad(
'subheading',
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
    <p>
      Paragraph
    </p>
  </sec>
</sec>
`
)

testLoad(
'link',
`
[link](https://stenci.la/)
`,
`<p>
  <ext-link ext-link-type="uri" xlink:href="https://stenci.la/">link</ext-link>
</p>
`
)

/*
Skipping these tests until stencila/pandoc is integrated here

testLoad(
'figure',
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
    <p>
      Caption
    </p>
  </caption>
  <graphic mimetype="image" mime-subtype="jpeg" xlink:href="fig.jpg" />
</fig>
`
)

testLoad(
'table',
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
    <p>
      Caption
    </p>
  </caption>
  <table>
    <col align="left" />
    <col align="left" />
    <thead>
      <tr>
        <th>
          <p>
            <bold role="strong">Col1</bold>
          </p>
        </th>
        <th>
          <p>
            <bold role="strong">Col2</bold>
          </p>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <p>
            Val1
          </p>
        </td>
        <td>
          <p>
            Val2
          </p>
        </td>
      </tr>
    </tbody>
  </table>
</table-wrap>
`
)

*/
