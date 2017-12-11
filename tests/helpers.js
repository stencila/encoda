const fs = require('fs')
const glob = require('glob')
const path = require('path')
const tmp = require('tmp')
const test = require('tape')

function testImportExport (converter, type, name, which, from, expected) {
  test(name + '.' + which + ' ' + from, (assert) => {
    const pathFrom = path.join(__dirname, type, 'fixtures', from)
    fs.accessSync(pathFrom)

    const pathExpected = path.join(__dirname, type, 'fixtures', expected)
    fs.accessSync(pathExpected)
    const dirExpected = path.dirname(pathExpected)

    const pathTo = path.join(tmp.dirSync().name, path.basename(expected))
    const dirTo = path.dirname(pathTo)

    converter[which](pathFrom, pathTo).then((result) => {
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
            assert.ok(result, `path "${path}" should canImport`)
          })
        })

        notOk.forEach((path) => {
          converter.canImport(path).then((result) => {
            assert.notOk(result, `path "${path}" should not canImport`)
          })
        })
      })
    },

    testImport: function (from, expected) {
      testImportExport(converter, type, name, 'import', from, expected)
    },

    testExport: function (from, expected) {
      testImportExport(converter, type, name, 'export', from, expected)
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
