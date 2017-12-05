import Converter from '../Converter'
import xml from '../util/xml'

export default class SheetConverter extends Converter {
  load () {
    return xml.load(`
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

  dump (sheet) {
    return xml.dump(sheet) + '\n'
  }
}
