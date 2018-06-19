const SheetConverter = require('./SheetConverter')

class TSVConverter extends SheetConverter {
  id () {
    return 'tsv'
  }

  options () {
    return Object.assign(super.options(), {
      from: 'tsv',
      to: 'tsv'
    })
  }
}

module.exports = TSVConverter
