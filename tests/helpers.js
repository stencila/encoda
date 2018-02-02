const fs = require('fs')
const glob = require('glob')
const path = require('path')
const tmp = require('tmp')
const test = require('tape')

// Test file contents are the same
function testImportExport (converter, type, name, which, from, expected, options = {}) {
  test(name + '.' + which + ' ' + from, (assert) => {
    const pathFrom = path.join(__dirname, type, 'fixtures', from)
    fs.accessSync(pathFrom)

    const pathExpected = path.join(__dirname, type, 'fixtures', expected)
    fs.accessSync(pathExpected)

    // Insert `-out.` into the output file name to distinguish it while
    // still maintaining the correct extension
    let match = path.basename(expected).match(/^([^.]+)\.(.+)$/)
    const pathTo = path.join(__dirname, type, 'fixtures', path.dirname(expected), `${match[1]}-out.${match[2]}`)

    converter[which](pathFrom, pathTo, fs, fs, options).then((result) => {
      const expectedString = fs.readFileSync(pathExpected).toString().trim()
      const actualString = fs.readFileSync(pathTo).toString().trim()
      const message = `${type}/fixtures/${expected}`
      if (expected.length < 100) assert.equal(actualString, expectedString, message)
      else assert.ok(actualString === expectedString, message)
      assert.end()
    }).catch((error) => {
      assert.fail(error.message)
      assert.end()
    })
  })
}

// Test file list and file contents are the same
function testDirImportExport (converter, type, name, which, from, expected, options = {}) {
  test(name + '.' + which + ' ' + from, (assert) => {
    const pathFrom = path.join(__dirname, type, 'fixtures', from)
    fs.accessSync(pathFrom)

    const pathExpected = path.join(__dirname, type, 'fixtures', expected)
    fs.accessSync(pathExpected)
    const dirExpected = path.dirname(pathExpected)

    const pathTo = path.join(tmp.dirSync().name, path.basename(expected))
    const dirTo = path.dirname(pathTo)

    converter[which](pathFrom, pathTo, fs, fs, options).then((result) => {
      glob(dirExpected + '/**/*', (err, filesExpected) => {
        if (err) assert.fail(err.message)
        glob(dirTo + '/**/*', (err, filesActual) => {
          if (err) assert.fail(err.message)

          assert.deepEqual(
            filesExpected.map(file => path.relative(pathExpected, file)),
            filesActual.map(file => path.relative(pathTo, file)),
            'file list should be the same'
          )

          filesExpected.forEach((fileExpected) => {
            const pathRelative = path.relative(pathExpected, fileExpected)
            const fileActual = path.join(pathTo, pathRelative)
            const expected = fs.readFileSync(fileExpected).toString().trim()
            const actual = fs.readFileSync(fileActual).toString().trim()
            if (expected.length < 100) assert.equal(actual, expected)
            else assert.ok(actual === expected, `${fileActual} == ${fileExpected}`)
          })

          assert.end()
        })
      })
    }).catch((error) => {
      assert.fail(error.message)
      assert.end()
    })
  })
}

function helpers (converter, type) {
  const name = converter.constructor.name

  return {
    testCanImport: function (ok, notOk, volume = null) {
      test(name + '.canImport', (assert) => {
        assert.plan(ok.length + notOk.length)

        ok.forEach((path) => {
          converter.canImport(path).then((result) => {
            assert.ok(result, `should be able to import file "${path}"`)
          })
        })

        notOk.forEach((path) => {
          converter.canImport(path).then((result) => {
            assert.notOk(result, `should not be able to import file "${path}"`)
          })
        })
      })
    },

    testCanExport: function (ok, notOk, volume = null) {
      test(name + '.canExport', (assert) => {
        assert.plan(ok.length + notOk.length)

        ok.forEach((path) => {
          converter.canExport(path).then((result) => {
            assert.ok(result, `should be able to export file "${path}"`)
          })
        })

        notOk.forEach((path) => {
          converter.canExport(path).then((result) => {
            assert.notOk(result, `should be able to export file "${path}"`)
          })
        })
      })
    },

    testImport: function (from, expected, options = {}) {
      testImportExport(converter, type, name, 'import', from, expected, options)
    },

    testExport: function (from, expected, options = {}) {
      testImportExport(converter, type, name, 'export', from, expected, options)
    },

    testLoad: function (name, content, expected, options = {}) {
      test(name, (assert) => {
        return converter.load(content, options).then((actual) => {
          assert.equal(actual, expected)
          assert.end()
        }).catch((error) => {
          console.error(error)
          assert.fail(error.message)
          assert.end()
        })
      })
    }
  }
}

module.exports = helpers
