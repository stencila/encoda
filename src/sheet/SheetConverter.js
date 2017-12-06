import Converter from '../Converter'

export default class SheetConverter extends Converter {
  get fileInternal () {
    return 'index.sheet.xml'
  }

  createDom (data) {
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
