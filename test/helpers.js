const fs = require('fs')
const glob = require('glob')
const path = require('path')
const tmp = require('tmp')
const test = require('tape')

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
      test(name + '.import ' + from, (assert) => {
        const pathFrom = path.join(__dirname, type, 'fixtures', from)
        fs.accessSync(pathFrom)

        const pathExpected = path.join(__dirname, type, 'fixtures', expected)
        fs.accessSync(pathExpected)
        const dirExpected = path.dirname(pathExpected)

        const pathTo = path.join(tmp.dirSync().name, path.basename(expected))
        const dirTo = path.dirname(pathTo)

        converter.import(pathFrom, pathTo).then((result) => {
          assert.pass('imported to ' + pathTo)
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
                const expected = fs.readFileSync(fileExpected).toString()
                const actual = fs.readFileSync(fileActual).toString()
                assert.ok(expected === actual, `Actual file ${fileActual} equal to expected file ${fileExpected}`)
              })

              assert.end()
            })
          })
        }).catch((error) => {
          assert.fail(error.message)
          assert.end()
        })
      })
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
