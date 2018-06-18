const PandocConverter = require('./PandocConverter')

class ODTConverter extends PandocConverter {
  id () {
    return 'odt'
  }

  options () {
    return Object.assign(super.options(), {
      from: 'odt',

      to: 'odt',
      exportArgs: [
        // "Extract images and other media contained in or linked from the source
        // document to the path DIR, creating it if necessary...""
        '--extract-media=media'
      ]
    })
  }
}

module.exports = ODTConverter
