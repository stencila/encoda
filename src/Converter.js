import { DefaultDOMElement } from 'substance'

export default class Converter {

  import (from, path, to, name) {
    return Promise.reject(
      new Error('Not implemented')
    )
  }

  export (from, path, to, name) {
    return Promise.reject(
      new Error('Not implemented')
    )
  }

  _createDom (name) {
    let doc = DefaultDOMElement.createDocument('xml')
    let $$ = doc.createElement.bind(doc)
    let dom = $$(name)
    doc.append(dom)
    return {dom, $$}
  }

}
