const DocumentXmdConverter = require('./DocumentXmdConverter')

class DocumentRmdConverter extends DocumentXmdConverter {
  extensions () {
    return ['rmd']
  }
}

module.exports = DocumentRmdConverter
