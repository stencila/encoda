import XMLDocument from '../util/XMLDocument'

import Converter from '../Converter'

export default class SheetConverter extends Converter {
  _xmlCreate () {
    return new XMLDocument(`
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
