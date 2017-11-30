import Converter from '../Converter'

export default class DocumentConverter extends Converter {

  _createDOM () {
    return super._createDOM('document')
  }

}
