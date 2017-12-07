const Converter = require('../Converter')

class FunctionConverter extends Converter {
  createDom () {
    return this.loadMXL(`<function/>`)
  }
}

module.exports = FunctionConverter
