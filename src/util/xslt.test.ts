import { transform, Processor } from './xslt'

describe('Processor', () => {
  test('returns empty string if not initialize', async () => {
    const proc = await Processor.create(stylesheet1)
    expect(await proc.transform(doc1)).toEqual(output1)
  })

  test('returns empty string if not initialize', async () => {
    const proc = new Processor()
    expect(await proc.transform('<foo>')).toEqual('')
  })
})

describe('transform', () => {
  test('example1', async () => {
    expect(await transform(doc1, stylesheet1)).toEqual(output1)
  })

  test('example2', async () => {
    expect(await transform(doc2, stylesheet2)).toEqual(output2)
  })

  test('returns parse errors', async () => {
    expect(await transform('<foo>', stylesheet1)).toMatch(
      /error on line 1 at column 6/
    )
  })
})

// Example from https://en.wikipedia.org/wiki/XSLT (with some modification)

const doc1 = `<?xml version="1.0" ?>
<persons>
  <person username="JS1">
    <name>John</name>
    <family-name>Smith</family-name>
  </person>
  <person username="MI1">
    <name>Morka</name>
    <family-name>Ismincius</family-name>
  </person>
</persons>`

const stylesheet1 = `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">
  <xsl:output method="xml" indent="yes"/>

  <xsl:template match="/">
    <root>
      <xsl:apply-templates select="//person"/>
    </root>
  </xsl:template>

  <xsl:template match="person">
    <name username="{@username}">
      <xsl:value-of select="name" />
    </name>
  </xsl:template>

</xsl:stylesheet>`

const output1 = `<root>
  <name username="JS1">John</name>
  <name username="MI1">Morka</name>
</root>`

// Example from https://github.com/backslash47/xslt/blob/8f8ddf0282d1db720912a5835687642fd21745ac/test/simple-test.ts

const doc2 = `
<root>
  <test name="test1" />
  <test name="test2" />
  <test name="test3" />
  <test name="test4" />
</root>`

const stylesheet2 = `<?xml version="1.0"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">
  <xsl:template match="test">
    <span> <xsl:value-of select="@name" /> </span>
  </xsl:template>
  <xsl:template match="/">
    <div>
      <xsl:apply-templates select="//test" />
    </div>
  </xsl:template>
</xsl:stylesheet>`

const output2 = `
<div>
  <span>test1</span>
  <span>test2</span>
  <span>test3</span>
  <span>test4</span>
</div>`.replace(/\s/g, '')
