const cheerio = require('cheerio')
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const rimraf = require('rimraf')

const xml = require('./helpers/xml')
const Converter = require('./Converter')
const JATSConverter = require('./JATSConverter')

class DarConverter extends Converter {
  id () {
    return 'dar'
  }

  async importable (darPath, volume = fs, format = null) {
    if (await super.importable(darPath, volume, format)) {
      return volume.existsSync(path.join(darPath, 'manifest.xml'))
    } else {
      return false
    }
  }

  async import (darPath, volume = fs, options = {}) {
    let files = {}

    const manifest = xml.load(await this.readFile(path.join(darPath, 'manifest.xml'), volume))
    const documents = manifest('documents').find('document').map((index, elem) => {
      const entry = cheerio(elem)
      return {
        name: entry.attr('name'),
        type: entry.attr('type'),
        filePath: entry.attr('path')
      }
    }).get()

    for (let {type, filePath} of documents) {
      const Converter = type === 'article' ? JATSConverter : null
      const converter = new Converter()
      const exedoc = await converter.import(path.join(darPath, filePath), volume, options)

      files[filePath] = exedoc
    }

    return {
      type: 'Folder',
      files: files
    }
  }

  async export (exedoc, darPath, volume = fs, options = {}) {
    let files
    if (exedoc.type === 'Folder') {
      files = exedoc.files
    } else {
      files = {'unnamed': exedoc}
    }

    const manifest = xml.load(`
      <!DOCTYPE sheet PUBLIC "DarManifest 0.1.0" "http://darformat.org/DarManifest-0.1.0.dtd">
      <dar>
        <documents></documents>
        <assets></assets>
      </dar>
    `)
    let documentsEl = manifest('documents')

    rimraf.sync(darPath)
    for (let [file, node] of Object.entries(files)) {
      const type = node.type === 'Sheet' ? 'sheet' : 'article'
      const Converter = type === 'article' ? JATSConverter : null
      const converter = new Converter()
      await converter.export(node, path.join(darPath, file), volume)

      const id = type + '-' + crypto.randomBytes(24).toString('hex')
      const name = file
      documentsEl.append(`<document id="${id}" name="${name}" type="${type}" path="${file}"/>`)
    }

    await this.writeFile(path.join(darPath, 'manifest.xml'), xml.dump(manifest), volume)
  }
}

module.exports = DarConverter
