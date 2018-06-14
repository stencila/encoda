const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

const xml = require('./helpers/xml')
const FolderConverter = require('./FolderConverter')
const JATSConverter = require('./JATSConverter')

class DarConverter extends FolderConverter {
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

  async import (path, volume = fs, options = {}) {
    // Read manifest.xml
    // Convert each of the files in the <documents> element
    return {
      type: 'Folder',
      documents: [],
      files: []
    }
  }

  async export (obj, darPath, volume = fs, options = {}) {
    let documents
    if (obj.documents) {
      documents = obj.documents
    } else {
      documents = [obj]
    }

    const manifest = xml.load(`
      <!DOCTYPE sheet PUBLIC "DarManifest 0.1.0" "http://darformat.org/DarManifest-0.1.0.dtd">
      <dar>
        <documents></documents>
        <assets></assets>
      </dar>
    `)
    let documentsEl = manifest('documents')
    for (let doc of documents) {
      const type = doc.type === 'Sheet' ? 'sheet' : 'article'
      const id = type + '-' + crypto.randomBytes(24).toString('hex')
      const name = doc.source || `Untitled ${type}`

      const Converter = type === 'article' ? JATSConverter : null
      const converter = new Converter()
      const ext = converter.extensions()[0]
      const filePath = `${id}.${ext}`
      await converter.export(doc, path.join(darPath, filePath), volume)

      documentsEl.append(`<document id="${id}" name="${name}" type="${type}" path="${filePath}"/>`)
    }

    await this.writeFile(
      path.join(darPath, 'manifest.xml'),
      xml.dump(manifest)
    )
  }
}

module.exports = DarConverter
