const fs = require('fs')

const PandocConverter = require('./PandocConverter')

class PDFConverter extends PandocConverter {
  id () {
    return 'pdf'
  }

  importable (path, volume = fs, format = null) {
    // It's not possible to import a PDF file
    return false
  }

  options () {
    return {
      // There is no Pandoc writer format for PDF,
      // instead the output file extension should be .pdf
      // See https://pandoc.org/MANUAL.html#creating-a-pdf
    }
  }
}

module.exports = PDFConverter
