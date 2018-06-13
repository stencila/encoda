const fs = require('fs')
const path = require('path')

const Converter = require('./Converter')

class FolderConverter extends Converter {
  id () {
    return 'folder'
  }

  async importable (path, volume = fs, format = null) {
    if (await super.importable(path, volume, format)) {
      return true
    } else {
      if (volume.existsSync(path)) {
        let stats = volume.lstatSync(path)
        return stats.isDirectory()
      } else {
        return false
      }
    }
  }

  async exportable (path, volume = fs, format = null) {
    if (await super.exportable(path, volume, format)) {
      return true
    } else {
      if (volume.existsSync(path)) {
        let stats = volume.lstatSync(path)
        return stats.isDirectory()
      } else {
        return false
      }
    }
  }

  /**
   * Imports all files in a folder that are importable
   * by other converters
   *
   * @param  {[type]} folderPath [description]
   * @param  {[type]} volume     [description]
   * @param  {Object} options    [description]
   * @return {[type]}            [description]
   */
  async import (folderPath, volume = fs, options = {}) {
    const {match} = require('./index')
    const docs = []
    const files = volume.readdirSync(folderPath)
    for (let file of files) {
      const converter = await match(file, volume, null, 'import')
      if (converter) {
        let doc = await converter.import(
          path.join(folderPath, file),
          volume
        )
        docs.push(doc)
      }
    }
    return {
      type: 'Folder',
      documents: docs,
      files: []
    }
  }
}

module.exports = FolderConverter
