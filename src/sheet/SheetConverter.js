import Converter from '../Converter'
import xml from '../util/xml'

export default class SheetConverter extends Converter {
  loadXml (data) {
    data = data || `
      <sheet>
        <meta>
          <name></name>
          <title></title>
          <description></description>
          <columns></columns>
        </meta>
        <data></data>
      </sheet>
    `
    return xml.load(data)
  }

  dumpXml (sheet) {
    return xml.dump(sheet) + '\n'
  }
}
