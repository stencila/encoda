import fs from 'fs'
import glob from 'glob'
import memfs from 'memfs'
import path from 'path'
import tmp from 'tmp'
import test from 'tape'

export default function helpers (converter, type) {
  const name = converter.constructor.name

  return {
    testMatch: function (ok, notOk, volume = null) {
      test(name + '.match', (assert) => {
        assert.plan(ok.length + notOk.length)

        ok.forEach((path) => {
          converter.match(path).then((result) => {
            assert.ok(result, `path "${path}" should match`)
          })
        })

        notOk.forEach((path) => {
          converter.match(path).then((result) => {
            assert.notOk(result, `path "${path}" should not match`)
          })
        })
      })
    },

    testImport: function (from, expected) {
      const fromPath = path.join(__dirname, type, 'fixtures', from)
      const expectedPath = path.join(__dirname, type, 'fixtures', expected)
      const toPath = tmp.dirSync().name
      converter.import(fromPath, toPath).then(() => {
        test(name + '.import ' + from, (assert) => {
          glob(expectedPath + '/**/*', (err, files) => {
            if (err) assert.fail(err.message)
            files.forEach((file) => {
              const relativePath = path.relative(expectedPath, file)
              const expected = fs.readFileSync(file, 'utf8')
              const actualPath = path.join(toPath, relativePath)
              const actual = fs.readFileSync(actualPath, 'utf8')
              assert.equal(actual, expected, `file "${relativePath}" should be the same`)
            })
            assert.end()
          })
        })
      })
    },

    testLoad: function (name, content, expected) {
      test(name, (assert) => {
        return converter.load(content).then((actual) => {
          assert.equal(actual, expected)
          assert.end()
        })
      })
    },

    testDump: function (name, content, expected) {
      test(name, (assert) => {
        return converter.dump(content).then((actual) => {
          assert.equal(actual, expected)
          assert.end()
        })
      })
    }
  }
}
