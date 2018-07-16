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
      } else if (type === 'article') {
        converter = new JATSConverter()
      } else {
        throw new Error(`Unhandled document type "${type}" when importing Dar`)
      }
      const doc = await converter.import(path.join(darPath, filePath), volume, options)

      files[filePath] = doc
    }

    return {
      type: 'Folder',
      files: files
    }
  }

  async export (doc, darPath, volume = fs, options = {}) {
    let files
    if (doc.type === 'Folder') {
      files = doc.files
    } else {
      files = {'unnamed': doc}
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
      let filePath
      let converter
      if (node.body && node.body.length === 1 && node.body[0].type === 'Table') {
        type = 'sheet'
        filePath = replaceExt(fileName, 'sheet.xml')
        converter = new SheetMLConverter()
      } else if (node.type === 'Document') {
        type = 'article'
        filePath = replaceExt(fileName, 'jats.xml')
        converter = new JATSConverter()
      } else {
        throw new Error(`Unhandled node type "${node.type}" when exporting to Dar`)
      }

      if (converter) {
        let filePathFull = path.join(darPath, filePath)
        await converter.export(node, filePathFull, volume)
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
