import { DefaultDOMElement } from 'substance'

import Converter from '../Converter'

export default class SheetConverter extends Converter {

  _importCreateElement () {
    let xml = DefaultDOMElement.createDocument('xml')
    let $$ = xml.createElement.bind(xml)
    let $sheet = $$('sheet')
    xml.append($sheet)

    return {
      $sheet,
      $$
    }
  }

  _importWriteBuffer ($sheet, buffer) {
    return buffer.writeFile('sheet.xml', $sheet.getOuterHTML() || '')
  }
}
