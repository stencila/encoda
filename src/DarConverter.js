const cheerio = require('cheerio')
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

const {replaceExt} = require('./helpers/util')
const xml = require('./helpers/xml')

const Converter = require('./Converter')
const JATSConverter = require('./JATSConverter')
const SheetMLConverter = require('./SheetMLConverter')

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
      let converter
      if (type === 'sheet') {
        converter = new SheetMLConverter()
      } else {
        converter = new JATSConverter()
      }
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

    for (let [fileName, node] of Object.entries(files)) {
      let type
      let filePath = fileName
      let converter

      if (node.body && node.body.length === 1 && node.body[0].type === 'Table') {
        type = 'sheet'
        filePath = replaceExt(fileName, 'sheet.xml')
        converter = new SheetMLConverter()
      } else if (node.type === 'Document') {
        type = 'article'
        filePath = replaceExt(fileName, 'jats.xml')
        converter = new JATSConverter()
      }

      if (converter) {
        await converter.export(node, path.join(darPath, filePath), volume)
      }

      const id = type + '-' + crypto.randomBytes(24).toString('hex')
      const name = fileName
      documentsEl.append(`<document id="${id}" name="${name}" type="${type}" path="${filePath}"/>`)
    }

    const manifestPath = path.join(darPath, 'manifest.xml')
    await this.writeFile(manifestPath, xml.dump(manifest), volume)
  }
}

module.exports = DarConverter
