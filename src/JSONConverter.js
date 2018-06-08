const fs = require('fs')

const Converter = require('./Converter')

class JSONConverter extends Converter {
  id () {
    return 'json'
  }

  async import (path, volume = fs, options = {}) {
    const json = await this.readFile(path, volume, options)
    return JSON.parse(json)
  }

  async export (doc, path, volume = fs, options = {}) {
    const json = JSON.stringify(doc, null, '  ')
    await this.writeFile(path, json, volume, options)
  }
}

module.exports = new JSONConverter()
