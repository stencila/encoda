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

  /**
   * Create a DOM document and root element for
   * importing to XML
   * 
   * @param  {string} name The tag name for the root element
   * @return {{DOMElement, createElement}}
   */
  _createDOM (name) {
    let doc = DefaultDOMElement.createDocument('xml')
    let $$ = doc.createElement.bind(doc)
    let dom = $$(name)
    doc.append(dom)
    return {dom, $$}
  }

}
