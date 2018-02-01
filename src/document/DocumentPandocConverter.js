const fs = require('fs')
const mkdirp = require('mkdirp')
const path = require('path')
const tmp = require('tmp')

const DocumentConverter = require('./DocumentConverter')
const pandoc = require('../helpers/pandoc')

class DocumentPandocConverter extends DocumentConverter {
  pandocFormat () {
    return 'jats'
  }

  pandocImportFormat () {
    return this.pandocFormat()
  }

  pandocImportArgs (options) {
    return [
      '--from', this.pandocImportFormat(),
      '--to', 'jats',
      // Writer options
      '--wrap', 'none' // Don't wrap text (shouldn't anyway for JATS, but older versions of Pandoc did)
    ]
  }

  pandocExportFormat () {
    return this.pandocFormat()
  }

  pandocExportArgs (options) {
    return [
      '--from', 'jats',
      '--to', this.pandocExportFormat(),
      // Writer options
      '--eol', options.eol || 'native' // Line endings : --eol=crlf|lf|native
    ]
  }

  extensions () {
    return [this.pandocFormat()]
  }

  import (pathFrom, pathTo, volumeFrom, volumeTo, options = {}) {
    pathTo = pathTo || path.join(tmp.dirSync().name, 'document.jats.xml')
    volumeFrom = volumeFrom || fs
    volumeTo = volumeTo || volumeFrom

    return this._convert(pathFrom, pathTo, volumeFrom, volumeTo, this.pandocImportArgs(options))
  }

  export (pathFrom, pathTo, volumeFrom, volumeTo, options = {}) {
    volumeFrom = volumeFrom || fs
    volumeTo = volumeTo || volumeFrom

    return this._convert(pathFrom, pathTo, volumeFrom, volumeTo, this.pandocExportArgs(options))
  }

  _convert (pathFrom, pathTo, volumeFrom, volumeTo, args) {
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
      input = this.readFile(pathFrom, volumeFrom)
    }
    // Read, spawn, write...
    return input.then((content) => {
      return pandoc.spawn(content, args)
    }).then(result => {
      if (!output) return pathTo
      else {
        return this.writeFile(pathTo, result, volumeTo).then(() => {
          return pathTo
        })
      }
    })
  }
}

module.exports = DocumentPandocConverter
