import test from 'tape'

import FunctionJsDocConverter from '../../src/function/FunctionJsDocConverter'

const converter = new FunctionJsDocConverter()

function testImport (name, jsdoc, xml) {
  test(name, (assert) => {
    converter.load(jsdoc).then((result) => {
      assert.equal(result.trim(), xml.trim())
      assert.end()
    })
  })
}

testImport(
'FunctionJsDocConverter.import param',
`@param {type} name Description`,
`<function>
    <params>
        <param name="name" type="type">
            <description>Description</description>
        </param>
    </params>
</function>`
)

testImport(
'FunctionJsDocConverter.import param array type',
`@param {array.<type>} name Description`,
`<function>
    <params>
        <param name="name" type="array[type]">
            <description>Description</description>
        </param>
    </params>
</function>`
)

testImport(
'FunctionJsDocConverter.import special characters',
`@example x < 5 && y < 5`,
`<function>
    <examples>
        <example>
            <usage>x &lt; 5 &amp;&amp; y &lt; 5</usage>
        </example>
    </examples>
</function>`
)

testImport(
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
</function>`
)
