const fs = require('fs')
const mkdirp = require('mkdirp')
const path = require('path')

const DocumentConverter = require('./DocumentConverter')
const pandoc = require('../helpers/pandoc')

class DocumentPandocConverter extends DocumentConverter {
  pandocArgs (args, options) {
    return args.concat([
      // Line endings : --eol=crlf|lf|native
      '--eol', options.eol || 'native'
    ])
  }

  import (pathFrom, pathTo, volumeFrom, volumeTo, options = {}) {
    return this.prepareImport(...arguments).then(({ pathFrom, pathTo, volumeFrom, volumeTo }) => {
      let args = this.pandocArgs([
        '--from', this.pandocFormat(),
        '--to', 'jats'
      ], options)
      // If volumeTo is the local filesystem then get pandoc to output
      // to there directly, otherwise write to the (virtual) filesystem
      let output = true
      if (volumeTo === fs) {
        mkdirp(path.dirname(pathTo))
        args = args.concat(['--output', pathTo])
        output = false
      }
      // If volumeFrom is the local filesystem then get pandoc to read
      // from there directly, otherwise read from the (virtual) filesystem
      let input
      if (volumeFrom === fs) {
        args = args.concat([pathFrom])
        input = Promise.resolve('')
      } else {
        input = this.readFile(pathFrom, volumeFrom, options)
      }
      // Read, spawn, write...
      return input.then((content) => {
        return pandoc.spawn(content, args)
      }).then(result => {
        if (!output) return pathTo
        else {
          return this.writeFile(pathTo, result, volumeTo, options).then(() => {
            return pathTo
          })
        }
      })
    })
  }

  export (pathFrom, pathTo, volumeFrom, volumeTo, options = {}) {
    return this.prepareExport(...arguments).then(({ pathFrom, pathTo, volumeFrom, volumeTo }) => {
      return this.readFile(pathFrom, volumeFrom).then((content) => {
        const args = this.pandocArgs([
          '--from', 'jats',
          '--to', this.pandocFormat()
        ], options)
        return pandoc.spawn(content, args)
      }).then(result => {
        return this.writeFile(pathTo, result, volumeTo, options).then(() => {
          return pathTo
        })
      })
    })
  }
}

module.exports = DocumentPandocConverter
