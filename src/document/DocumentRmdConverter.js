const DocumentMdConverter = require('./DocumentMdConverter')

class DocumentRmdConverter extends DocumentMdConverter {
  extensions () {
    return ['rmd']
  }
}

module.exports = DocumentRmdConverter
