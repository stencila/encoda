const DocumentPandocConverter = require('./DocumentPandocConverter')

class DocumentOdtConverter extends DocumentPandocConverter {
  pandocFormat () {
    return 'odt'
  }

  pandocExportArgs (args, options) {
    return super.pandocExportArgs(args, options).concat([
      // "Extract images and other media contained in or linked from the source
      // document to the path DIR, creating it if necessary...""
      '--extract-media=media'
    ])
  }
}

module.exports = DocumentOdtConverter
