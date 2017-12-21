const DocumentPandocConverter = require('./DocumentPandocConverter')

class DocumentLatexConverter extends DocumentPandocConverter {
  extensions () {
    return ['tex']
  }

  pandocFormat () {
    return 'latex'
  }
}

module.exports = DocumentLatexConverter
