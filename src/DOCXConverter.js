const PandocConverter = require('./PandocConverter')

class DOCXConverter extends PandocConverter {
  id () {
    return 'docx'
  }

  options () {
    return Object.assign(super.options(), {
      from: 'docx',

      to: 'docx',
      exportArgs: [
        // "Extract images and other media contained in or linked from the source
        // document to the path DIR, creating it if necessary...""
        '--extract-media=media'
      ]
    })
  }
}

module.exports = DOCXConverter
