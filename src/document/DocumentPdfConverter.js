const DocumentPandocConverter = require('./DocumentPandocConverter')

class DocumentPdfConverter extends DocumentPandocConverter {
  canImport (pathFrom) {
    // Currently unable to import PDF
    return Promise.resolve(false)
  }

  canExport (pathTo) {
    return this.matchExtensions(pathTo, ['pdf'])
  }

  pandocExportArgs (options) {
    // The is no writer format for PDF, instead the output file extension should be .pdf
    return [
      '--from', 'jats'
    ]
  }
}

module.exports = DocumentPdfConverter
