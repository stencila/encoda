const PandocConverter = require('./PandocConverter')

class LatexConverter extends PandocConverter {
  id () {
    return 'latex'
  }

  extensions () {
    return ['tex']
  }

  options () {
    return Object.assign(super.options(), {
      from: 'latex',

      to: 'latex'
    })
  }
}

module.exports = LatexConverter
