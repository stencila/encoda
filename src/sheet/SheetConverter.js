const Converter = require('../Converter')

class SheetConverter extends Converter {
  get fileInternal () {
    return 'index.sheet.xml'
  }

  createDom () {
    return this.loadXml(`
      <sheet>
        <meta>
          <name></name>
          <title></title>
          <description></description>
          <columns></columns>
        </meta>
        <data></data>
      </sheet>
    `)
  }
}

module.exports = SheetConverter
