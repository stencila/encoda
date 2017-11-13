import Converter from '../Converter'

export default class FunctionConverter extends Converter {

  _createDom () {
    return super._createDom('function')
  }

}
