const fs = require('fs')
const path = require('path')
const rimraf = require('rimraf')

const Converter = require('./Converter')
const FolderConverter = require('./FolderConverter')
const {replaceExt} = require('./helpers/util')

class EDFConverter extends Converter {
  id () {
    return 'edf'
  }

  extensions () {
    return ['edf', 'edf.json']
  }

  async import (edfPath, volume = fs, options = {}) {
    let stats = volume.lstatSync(edfPath)
    if (stats.isFile()) {
      let json = await this.readFile(edfPath, volume, options)
      return JSON.parse(json)
    } else {
      const converter = new FolderConverter()
      return converter.import(edfPath, volume, options)
    }
  }

  async export (exedoc, edfPath, volume = fs, options = {}) {
    if (exedoc.type === 'Document') {
      let json = JSON.stringify(exedoc, null, '  ')
      await this.writeFile(edfPath, json, volume, options)
    } else if (exedoc.type === 'Folder') {
      rimraf.sync(edfPath)
      let promises = Object.entries(exedoc.files).map(([fileName, node]) => {
        if (node) {
          const fileNameNew = replaceExt(fileName, 'edf.json')
          const pathNew = path.join(edfPath, fileNameNew)
          return this.export(node, pathNew, volume, options)
        } else {
          return true
        }
      })
      await Promise.all(promises)
    }
  }
}

module.exports = EDFConverter
