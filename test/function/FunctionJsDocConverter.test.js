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

  `

  const xml = `
<function>
    <name>function_name</name>
    <title>Function name</title>
    <summary>The function summary</summary>
    <author>Joe Bloggs</author>
    <author>Jane Doe</author>
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
