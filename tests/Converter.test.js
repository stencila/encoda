const test = require('tape')
const path = require('path')
const memfs = require('memfs')

const Converter = require('../src/Converter')

const converter = new Converter()

test('Converter.import', (assert) => {
  const content = 'Some external content'
  const volume = memfs.Volume.fromJSON({
    'pathFrom.txt': content
  })

  converter.import('pathFrom.txt', 'pathTo.txt', volume).then((pathTo) => {
    assert.equal(volume.readFileSync(pathTo, 'utf8'), content, 'default export behaviour is just to copy content')
    assert.end()
  })
})

test('Converter.export', (assert) => {
  const content = 'Some internal content'
  const volume = memfs.Volume.fromJSON({
    'pathFrom.txt': content
  })

  converter.export('pathFrom.txt', 'pathTo.txt', volume).then((pathTo) => {
    assert.equal(volume.readFileSync(pathTo, 'utf8'), content, 'default export behaviour is just to copy content')
    assert.end()
  })
})

test('Converter.load+dump', (assert) => {
  const content = 'Some content'

  assert.plan(2)

  converter.load(content).then((converted) => {
    assert.equal(converted, content, 'no conversion done')
  })

  converter.dump(content).then((converted) => {
    assert.equal(converted, content, 'no conversion done')
  })
})

test('Converter.loadXml', (assert) => {
  converter.loadXml('<foo><bar>baz</bar></foo>').then((dom) => {
    // jQuery API
    assert.equal(dom('foo').html(), '<bar>baz</bar>')
    assert.equal(dom('foo bar').html(), 'baz')
    assert.equal(dom('foo').find('bar').html(), 'baz')

    // Character encoding
    const child = dom('<beep>')
    child.text('& < >')
    dom('foo').append(child)
    assert.equal(dom.xml(), '<foo><bar>baz</bar><beep>&amp; &lt; &gt;</beep></foo>')

    assert.end()
  })
})

test('Converter.dumpXml', (assert) => {
  assert.plan(2)

  converter.loadXml('<foo><bar>baz</bar></foo>').then((dom) => {
    converter.dumpXml(dom, {pretty: false}).then((xml) => {
      assert.equal(xml, '<foo><bar>baz</bar></foo>')
    })
    converter.dumpXml(dom).then((xml) => {
      assert.equal(xml, '<foo>\n  <bar>baz</bar>\n</foo>')
    })
  })
})

test('Converter.readXml+writeXml', (assert) => {
  const xml = '<foo><bar>baz</bar></foo>'
  const volume = memfs.Volume.fromJSON({
    '/file.xml': xml
  })

  assert.plan(2)

  converter.readXml('/file.xml', volume).then((dom) => {
    converter.dumpXml(dom, {pretty: false}).then((actual) => {
      assert.equal(actual, xml)
    })
  })

  converter.loadXml(xml).then((dom) => {
    converter.writeXml('/actual.xml', dom, volume, {pretty: false}).then((actual) => {
      assert.equal(volume.readFileSync('/actual.xml', 'utf8'), xml)
    })
  })
})
