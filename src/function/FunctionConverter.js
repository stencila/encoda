const Converter = require('../Converter')

class FunctionConverter extends Converter {

  _createDOM () {
    return super._createDOM('function')
  }

}

module.exports = FunctionConverter
