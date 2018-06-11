const cheerio = require('cheerio')
const fs = require('fs')
const memfs = require('memfs')
const path = require('path')

const PandocConverter = require('./PandocConverter')
const xml = require('./helpers/xml')

class JATSConverter extends PandocConverter {
  id () {
    return 'jats'
  }

  extensions () {
    return ['jats.xml', 'jats']
  }

  options () {
    return {
      from: 'jats',

      to: 'jats',
      standalone: true,
      template: path.join(__dirname, 'JATSTemplate.xml'),
      exportArgs: [
        '--wrap', 'none' // Don't wrap text (shouldn't anyway for JATS, but older versions of Pandoc did)
      ]
    }
  }

  async import (path, volume = fs, options = {}) {
    options = Object.assign(this.options(), options)

    const jats = await this.readFile(path, volume)

    // Pre-process JATS
    const dom = xml.load(jats)

    // Covert JATS4M code cells e.g.
    //   <code specific-use="cell"><named-content><alternatives>
    //     <code specific-use="source" language="python" executable="yes">...</code>
    //     <code specific-use="output" language="json"></code>
    //   </alternatives></named-content></code>
    // to JATS executable code blocks
    //   <code language="python" executable="yes">...</code>
    dom('code[specific-use="cell"]').each((index, elem) => {
      let cell = cheerio(elem)
      let source = cell.find('code[specific-use="source"]')
      cell.replaceWith(source)
    })

    // Convert pre-processed JATS
    const pathTemp = '/temp-import.jats'
    const volumeTemp = new memfs.Volume()
    const jatsNew = xml.dump(dom)
    await this.writeFile(pathTemp, jatsNew, volumeTemp)
    return super.import(pathTemp, volumeTemp, options)
  }

  async export (doc, path, volume = fs, options = {}) {
    options = Object.assign(this.options(), options)

    const pathTemp = '/temp-export.jats'
    const volumeTemp = new memfs.Volume()
    await super.export(doc, pathTemp, volumeTemp, options)
    let jats = await this.readFile(pathTemp, volumeTemp)

    // Post-process JATS XML
    const dom = xml.load(jats)

    // Convert `<code>` elements to cells e.g.
    //   <code language="python">...</code>
    // To JATS4M cells
    //   <code specific-use="cell"><named-content><alternatives>
    //     <code specific-use="source" language="python" executable="yes">...</code>
    //     <code specific-use="output" language="json"></code>
    //   </alternatives></named-content></code>
    dom('code[language]').each((index, elem) => {
      let code = cheerio(elem)
      // Pandoc does some transformation of language codes (e.g. `py` -> `python`, `r` -> `r script`)
      // So normalise to the codes that Stencila uses
      let language = code.attr('language')
      language = {
        'r script': 'r',
        'python': 'py'
      }[language] || language
      // Check for Jupyter code type
      let codeType = code.attr('code-type')
      if (codeType) {
        if (codeType === 'jupyter') language += 'jp'
      }

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

    // Write post-processed JATS
    const jatsNew = xml.dump(dom, {
      declaration: options.standalone,
      tagsUnformatted: ['bold', 'italic', 'ext-link'],
      tagsContentUnformatted: ['p', 'preformat', 'code']
    })
    await this.writeFile(path, jatsNew, volume)
  }
}

module.exports = JATSConverter
