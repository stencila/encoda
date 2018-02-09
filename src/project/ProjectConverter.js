const Converter = require('../Converter')

const documentConverters = require('../document')
const sheetConverters = require('../sheet')

class ProjectConverter extends Converter {
  createDom () {
    return this.loadXml(`
      <archive type="rda">
        <documents></documents>
        <assets></assets>
      </archive>
    `)
  }

  get converters () {
    return [].concat(
      Object.values(documentConverters),
      Object.values(sheetConverters)
    )
  }
}

module.exports = ProjectConverter
