const Converter = require('../Converter')

class DocumentConverter extends Converter {
  extensions () {
    return ['jats']
  }
}

module.exports = DocumentConverter
