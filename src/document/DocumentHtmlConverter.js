const DocumentPandocConverter = require('./DocumentPandocConverter')

class DocumentHtmlConverter extends DocumentPandocConverter {
  pandocFormat () {
    return 'html'
  }
}

module.exports = DocumentHtmlConverter
