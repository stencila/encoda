import test from 'tape'
import { Volume } from 'memfs'

import FunctionJsDocConverter from '../../src/function/FunctionJsDocConverter'

const conv = new FunctionJsDocConverter()

test('import', (assert) => {
  const jsdoc = `
@name function_name

@title Function name

@summary The function summary

@author Joe Bloggs
@author Jane Doe

@description

The function description which may be several paragraphs.

Here is the second paragraph.

This could be **Markdown**, but that is not support right now.

@param {type1} param1 Description for param1.
@param {type2} [param2] Param2 is optional (i.e. default value is null)
@param {type3} [param3=default3] Param3 has a default value.
@param {*} param4 Asterisk means type is "any".
  `

  const xml = `
<function>
    <name>function_name</name>
    <author>Joe Bloggs</author>
    <author>Jane Doe</author>
    <title>Function name</title>
    <summary>The function summary</summary>
    <description>The function description which may be several paragraphs. Here is the second paragraph. This could be **Markdown**, but that is not support right now.</description>
    <params>
        <param name="param1" type="type1">
            <description>Description for param1.</description>
        </param>
        <param name="param2" type="type2">
            <default>null</default>
            <description>Param2 is optional (i.e. default value is null)</description>
        </param>
        <param name="param3" type="type3">
            <default>default3</default>
            <description>Param3 has a default value.</description>
        </param>
        <param name="param4" type="any">
            <description>Asterisk means type is "any".</description>
        </param>
    </params>
</function>
  `.trim()

  const from = new Volume()
  const to = new Volume()
  from.writeFileSync('/test.txt', jsdoc)
  conv.import(from, '/test.txt', to, '/test').then(() => {
    const xmlGot = to.readFileSync('/test.fun.xml', 'utf8')
    assert.equal(xmlGot, xml)
    assert.end()
  })
})
