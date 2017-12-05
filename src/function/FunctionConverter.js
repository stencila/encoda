import Converter from '../Converter'

export default class FunctionConverter extends Converter {
  createDom () {
    return this.loadMXL(`<function/>`)
  }
}
