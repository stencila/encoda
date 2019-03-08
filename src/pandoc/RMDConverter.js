const XMDConverter = require('./XMDConverter')

class RMDConverter extends XMDConverter {
  id () {
    return 'rmd'
  }
  extensions () {
    return ['rmd']
  }
}

module.exports = RMDConverter
