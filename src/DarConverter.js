const cheerio = require('cheerio')
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

const {getExt, replaceExt} = require('./helpers/util')
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
      const ext = getExt(fileName)

      let type
      let filePath = fileName
      let converter

      // TODO this is a temporary implementation to avoid overwriting files
      // already 'managed' in the manifest. More consideration needs to
      // be given to how this is best done (i.e overwriting manifest or 'merging' other files into it;
      // a general option to turn on/off overwriting of already converted files?)
      if (ext === 'jats.xml') {
        type = 'article'
      } else if (ext === 'sheet.xml') {
        type = 'sheet'
      } else if (node.body && node.body.length === 1 && node.body[0].type === 'Table') {
        type = 'sheet'
        filePath = replaceExt(fileName, 'sheet.xml')
        converter = new SheetMLConverter()
      } else {
        type = 'article'
        filePath = replaceExt(fileName, 'jats.xml')
        converter = new JATSConverter()
      }

      let filePathFull = path.join(darPath, filePath)
      if (converter && !volume.existsSync(filePathFull)) {
        await converter.export(node, filePathFull, volume)
      }

      const id = type + '-' + crypto.randomBytes(24).toString('hex')
      const name = fileName
      documentsEl.append(`<document id="${id}" name="${name}" type="${type}" path="${filePath}"/>`)
    }

    await this.writeFile(path.join(darPath, 'manifest.xml'), xml.dump(manifest), volume)
  }
}

module.exports = DarConverter
