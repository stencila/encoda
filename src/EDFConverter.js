const fs = require('fs')
const path = require('path')

const FolderConverter = require('./FolderConverter')

class EDFConverter extends FolderConverter {
  id () {
    return 'edf'
  }

  async importable (edfPath, volume = fs, format = null) {
    if (await super.importable(edfPath, volume, format)) {
      return volume.existsSync(path.join(edfPath, 'folder.edf.json'))
    } else {
      return false
    }
  }

  async import (edfPath, volume = fs, format = null) {
    const json = await this.readFile(
      path.join(edfPath, 'folder.edf.json')
    )
    return JSON.parse(json)
  }

  async export (object, edfPath, volume = fs, options = {}) {
    // If object is not a `Folder`, then create one from the document
    let folder
    if (object.type === 'Folder') {
      folder = object
    } else {
      folder = {
        type: 'Folder',
        documents: [object]
      }
    }

    // Dump folder
    await this.writeFile(
      path.join(edfPath, 'folder.edf.json'),
      JSON.stringify(folder, null, '  ')
    )
  }
}

module.exports = EDFConverter
