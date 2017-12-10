const DocumentPandocConverter = require('./DocumentPandocConverter')

class DocumentDOCXConverter extends DocumentPandocConverter {
  canImport (pathFrom) {
    return this.matchExtensions(pathFrom, ['docx'])
  }

  canExport (pathTo) {
    return this.matchExtensions(pathTo, ['docx'])
  }

  pandocFormat () {
    return 'docx'
  }

  pandocArgs (args, options) {
    return super.pandocArgs(args, options).concat([
      // "Extract images and other media contained in or linked from the source
      // document to the path DIR, creating it if necessary...""
      '--extract-media=media'
    ])
  }
}

module.exports = DocumentDOCXConverter
