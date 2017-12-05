import Converter from '../Converter'
import xml from '../util/xml'

export default class FunctionConverter extends Converter {
  load () {
    return xml.load(`
      <function/>
    `)
  }

  dump (sheet) {
    return xml.dump(sheet) + '\n'
  }
}
