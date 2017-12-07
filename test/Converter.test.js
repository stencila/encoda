const test = require('tape')
const path = require('path')
const memfs = require('memfs')

const Converter = require('../src/Converter')

const converter = new Converter()

test('Converter.prepareImport+prepareExport', (assert) => {
  assert.plan(6)

  converter.prepareImport('some-file-a.txt', 'some-file-b.txt').then((result) => {
    assert.equal(result.pathFrom, 'some-file-a.txt')
    assert.equal(result.pathTo, 'some-file-b.txt')
  })

  converter.prepareImport('some-dir', 'some-other-dir').then((result) => {
    assert.equal(result.pathFrom, path.join('some-dir', 'external.txt'))
    assert.equal(result.pathTo, path.join('some-other-dir', 'internal.txt'))
  })

  converter.prepareExport('some-dir', 'some-other-dir').then((result) => {
    assert.equal(result.pathFrom, path.join('some-dir', 'internal.txt'))
    assert.equal(result.pathTo, path.join('some-other-dir', 'external.txt'))
  })
})

test('Converter.import', (assert) => {
  const content = 'Some external content'
  const volume = memfs.Volume.fromJSON({
    '/external.txt': content
  })

  assert.plan(5)

  converter.import('/external.txt', '/some-file.txt', volume).then((path) => {
    assert.equal(path, '/some-file.txt', 'if pathTo is a file name then it gets returned')
    assert.equal(volume.readFileSync(path, 'utf8'), content, 'no conversion done, content simply copied')
  })

  converter.import('/external.txt', '/some-folder/some-sub-folder/some-file.txt', volume).then((path) => {
    assert.ok(volume.statSync(path, 'utf8'), 'necessary pathTo directories are created')
  })

  converter.import('/', '/', volume).then((pathTo) => {
    assert.equal(pathTo, path.join('/', 'internal.txt'), 'if pathTo is a folder then returns a default filename')
    assert.equal(volume.readFileSync(pathTo, 'utf8'), content, 'if pathFrom is a folder then uses a default filename')
  })
})

test('Converter.export', (assert) => {
  const content = 'Some internal content'
  const volume = memfs.Volume.fromJSON({
    '/internal.txt': content
  })

  assert.plan(2)

  converter.export('/', '/', volume).then((pathTo) => {
    assert.equal(pathTo, path.join('/', 'external.txt'), 'if pathTo is a folder then returns a default filename')
    assert.equal(volume.readFileSync(pathTo, 'utf8'), content, 'if pathFrom is a folder then uses a default filename')
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

    // Charachter encoding
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
