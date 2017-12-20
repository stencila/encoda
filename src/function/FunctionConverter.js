const Converter = require('../Converter')

class FunctionConverter extends Converter {
  createDom () {
    return this.loadXml(`<function/>`)
  }
}

module.exports = FunctionConverter
