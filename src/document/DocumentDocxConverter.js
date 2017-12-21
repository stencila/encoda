const DocumentPandocConverter = require('./DocumentPandocConverter')

class DocumentDocxConverter extends DocumentPandocConverter {
  pandocFormat () {
    return 'docx'
  }

  pandocExportArgs (args, options) {
    return super.pandocExportArgs(args, options).concat([
      // "Extract images and other media contained in or linked from the source
      // document to the path DIR, creating it if necessary...""
      '--extract-media=media'
    ])
  }
}

module.exports = DocumentDocxConverter
