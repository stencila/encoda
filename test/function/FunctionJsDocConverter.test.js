import test from 'tape'
import memfs from 'memfs'

import FunctionJsDocConverter from '../../src/function/FunctionJsDocConverter'
import helpers from '../helpers'

const converter = new FunctionJsDocConverter()
const { testImportString } = helpers(converter, 'sheet')

testImportString(
'FunctionJsDocConverter.import param',
`@param {type} name Description`,
`<function>
  <params>
    <param name="name" type="type">
      <description>Description</description>
    </param>
  </params>
</function>
`
)

testImportString(
'FunctionJsDocConverter.import param array type',
`@param {array.<type>} name Description`,
`<function>
  <params>
    <param name="name" type="array[type]">
      <description>Description</description>
    </param>
  </params>
</function>
`)

test('FunctionJsDocConverter.import unknown param type', (assert) => {
  const fs = memfs.Volume.fromJSON({
    '/from.txt': '@param {(This|Or|That)} name'
  })
  converter.import('/from.txt', '/to.txt', fs).then(() => {
    assert.fail('should error')
    assert.end()
  }).catch((error) => {
    assert.equal(error.message, 'Unhandled @param type specification: UnionType')
    assert.end()
  })
})

test('FunctionJsDocConverter.import unknown return type', (assert) => {
  const fs = memfs.Volume.fromJSON({
    '/from.txt': '@return {(This|Or|That)} name'
  })
  converter.import('/from.txt', '/to.txt', fs).then(() => {
    assert.fail('should error')
    assert.end()
  }).catch((error) => {
    assert.equal(error.message, 'Unhandled @return type specification: UnionType')
    assert.end()
  })
})

testImportString(
'FunctionJsDocConverter.import special characters',
`@example x < 5 && y < 5`,
`<function>
  <examples>
    <example>
      <usage>x &lt; 5 &amp;&amp; y &lt; 5</usage>
    </example>
  </examples>
</function>
`)

testImportString(
'FunctionJsDocConverter.import complete',
`@name function_name

@title Function name

@summary The function summary

@description

The function description which may be several paragraphs.

Here is the second paragraph.

This could be **Markdown**, but that is not support right now.

@param {type1} param1 Description for param1.
@param {type2} [param2] Param2 is optional (i.e. default value is null)
@param {type3} [param3=default3] Param3 has a default value.
@param {*} param4 Asterisk means type is "any".

@return {typeReturn} Description of return.

@example

function_name(param1, param2=42)

@implem js
@implem r

@author Joe Bloggs
@author Jane Doe`,
`<function>
  <name>function_name</name>
  <title>Function name</title>
  <summary>The function summary</summary>
  <description>The function description which may be several paragraphs. Here is the second paragraph. This could be **Markdown**, but that is not support right now.</description>
  <examples>
    <example>
      <usage>function_name(param1, param2=42)</usage>
    </example>
  </examples>
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
      <description>Asterisk means type is &quot;any&quot;.</description>
    </param>
  </params>
  <return type="typeReturn">
    <description>Description of return.</description>
  </return>
  <implems>
    <implem language="js" />
    <implem language="r" />
  </implems>
  <authors>
    <author>Joe Bloggs</author>
    <author>Jane Doe</author>
  </authors>
</function>
`)
