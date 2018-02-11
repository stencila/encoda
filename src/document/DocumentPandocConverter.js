const cheerio = require('cheerio')
const fs = require('fs')
const memfs = require('memfs')
const mkdirp = require('mkdirp')
const path = require('path')

const DocumentConverter = require('./DocumentConverter')
const pandoc = require('../helpers/pandoc')

const JATS_EXTS = /(\.jats)|(\.jats\.xml)$/
const JATS_TEMPLATE = path.join(__dirname, 'DocumentJatsTemplate.xml')

class DocumentPandocConverter extends DocumentConverter {
  extensions () {
    return [this.pandocFormat()]
  }

  canImport (pathFrom) {
    if (this.pandocImportFormat() === 'jats') return Promise.resolve(pathFrom.match(JATS_EXTS) !== null)
    else return this.matchExtensions(pathFrom, this.extensions())
  }

  canExport (pathTo) {
    if (this.pandocExportFormat() === 'jats') return Promise.resolve(pathTo.match(JATS_EXTS) !== null)
    else return this.matchExtensions(pathTo, this.extensions())
  }

  pandocFormat () {
    return 'jats'
  }

  pandocImportFormat () {
    return this.pandocFormat()
  }

  pandocImportArgs (options = {}) {
    if (options.complete !== false) options.complete = true

    let args = [
      '--from', this.pandocImportFormat(),
      '--to=jats',
      '--wrap', 'none' // Don't wrap text (shouldn't anyway for JATS, but older versions of Pandoc did)
    ]
    if (options.complete) {
      args = args.concat([
        '--standalone',
        '--template', JATS_TEMPLATE
      ])
    }
    return args
  }

  pandocExportFormat () {
    return this.pandocFormat()
  }

  pandocExportArgs (options) {
    return [
      '--from', 'jats',
      '--to', this.pandocExportFormat(),
      // Writer options (for writing the exported content)
      '--eol', options.eol || 'native' // Line endings : --eol=crlf|lf|native
    ]
  }

  import (pathFrom, pathTo, volumeFrom, volumeTo, options = {}) {
    pathTo = pathTo || (pathFrom + '.jats.xml')
    volumeFrom = volumeFrom || fs
    volumeTo = volumeTo || volumeFrom
    if (options.complete !== false) options.complete = true

    const volumeTemp = new memfs.Volume()
    return this._convert(pathFrom, '/temp.jats', volumeFrom, volumeTemp, this.pandocImportArgs(options)).then(() => {
      return this.readXml('/temp.jats', volumeTemp)
    }).then((dom) => {
      // Convert `<code>` elements with `executable="yes"` to cells e.g.
      //   <code language="python" executable="yes">...</code>
      // To JATS4M cells
      //   <code specific-use="cell"><named-content><alternatives>
      //     <code specific-use="source" language="python" executable="yes">...</code>
      //     <code specific-use="output" language="json"></code>
      //   </alternatives></named-content></code>
      dom('code[language][executable=yes]').each((index, elem) => {
        let code = cheerio(elem)
        // Pandoc does some transformation of language codes (e.g. `py` -> `python`, `r` -> `r script`)
        // So normalise to the codes that Stencila uses
        let language = code.attr('language')
        language = {
          'r script': 'r',
          'python': 'py'
        }[language] || language

        let cell = `<alternatives>
          <code specific-use="source" language="${language}" executable="yes">${code.text()}</code>
          <code specific-use="output" language="json">{}</code>
        </alternatives>`
        let parent = code.parent()
        if (parent.is('fig')) {
          parent.attr('fig-type', 'repro-fig')
        } else {
          cell = `<code specific-use="cell"><named-content>${cell}</code>`
        }
        code.replaceWith(cell)
      })

      // Fix reference list produced by Pandoc citeproc which can contain
      // text. Eventually it may be better use a custom CSL file.
      // e.g. https://github.com/jgm/pandoc/blob/cf7d66c097ea8b93b5ece86aaa336994b0b281e9/data/jats.csl
      dom('ref-list ref').each((index, elem) => {
        let ref = cheerio(elem)

        // Ignore any text in person-group elements by only
        // extracting what is needed
        let personGroup = ref.find('person-group')
        let personGroupNew = cheerio('<person-group person-group-type="author"/>')
        let names = personGroup.find('name')
        names.each((index, elem) => {
          let name = cheerio(elem)
          let nameNew = cheerio('<name/>')
          nameNew.append(name.find('surname'))
          nameNew.append(name.find('given-names'))
          personGroupNew.append(nameNew)
        })
        personGroup.replaceWith(personGroupNew)

        // Unwrap <year> etc from <date>
        let date = ref.find('date')
        date.replaceWith(date.html())
      })

      return this.writeXml(pathTo, dom, volumeTo, {
        declaration: options.complete,
        tagsUnformatted: ['bold', 'italic', 'ext-link'],
        tagsContentUnformatted: ['p', 'preformat', 'code']
      }).then(() => {
        return {
          pathFrom, pathTo, formatTo: 'application/jats4m'
        }
      })
    })
  }

  export (pathFrom, pathTo, volumeFrom, volumeTo, options = {}) {
    volumeFrom = volumeFrom || fs
    volumeTo = volumeTo || volumeFrom

    // TODO
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
