const fs = require('fs')
const yaml = require('js-yaml')

const Converter = require('./Converter')

class EDFYConverter extends Converter {
  id () {
    return 'edfy'
  }

  extensions () {
    return ['edfy', 'edf.yaml', 'edf.yml']
  }

  async import (path, volume = fs, options = {}) {
    const yml = await this.readFile(path, volume, options)
    return yaml.load(yml)
  }

  async export (exedoc, path, volume = fs, options = {}) {
    const yml = yaml.dump(exedoc)
    return this.writeFile(path, yml, volume, options)
  }
}

module.exports = EDFYConverter
