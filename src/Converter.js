import { DefaultDOMElement } from 'substance'
import { Volume } from 'memfs'

export default class Converter {
  import (from, path, to, name) {
    /* istanbul ignore next */
    return Promise.reject(
      new Error('Not implemented')
    )
  }

  export (from, path, to, name) {
    /* istanbul ignore next */
    return Promise.reject(
      new Error('Not implemented')
    )
  }

  /**
   * Convert
   *
   * A convenience wrapper around `import` that takes and returns
   * a string of the 'main' source and sink files.
   *
   * @param  {string} content The content to convert
   * @return {string}         The converted content
   */
  load (content) {
    const from = new Volume()
    from.writeFileSync('/temp', content)
    const to = new Volume()
    return this.import(from, '/temp', to, '/temp').then((main) => {
      return to.readFileSync(main, 'utf8')
    })
  }

  dump (from, path) {
    /* istanbul ignore next */
    return Promise.reject(
      new Error('Not implemented')
    )
  }

  /**
   * Create a DOM document and root element for
   * importing to XML
   *
   * @param  {string} name The tag name for the root element
   * @return {{dom: DOMElement, $$: function}}
   */
  _createDOM (name) {
    let doc = DefaultDOMElement.createDocument('xml')
    let $$ = doc.createElement.bind(doc)
    let dom = $$(name)
    doc.append(dom)
    return {dom, $$}
  }

  /**
   * Encode certain characters that cause parsing errors in XML and HTML
   * as character entities
   *
   * @param  {string} text Text to encode
   * @return {string}      Encoded text
   */
  _encodeChars (text) {
    return text.replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;')
               .replace(/"/g, '&quot;')
               .replace(/'/g, '&apos;')
  }
}
