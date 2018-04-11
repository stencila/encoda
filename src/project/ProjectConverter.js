const Converter = require('../Converter')

const documentConverters = require('../document')
const sheetConverters = require('../sheet')

class ProjectConverter extends Converter {
  createDom () {
    return this.loadXml(`
      <!DOCTYPE sheet PUBLIC "DarManifest 0.1.0" "http://darformat.org/DarManifest-0.1.0.dtd">
      <dar>
        <documents></documents>
        <assets></assets>
      </dar>
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
