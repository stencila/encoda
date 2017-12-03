import cheerio from 'cheerio'
import {html as beautifyHtml} from 'js-beautify'

export default class XMLDocument {
  constructor (xml) {
    this._cheerio = cheerio.load(xml, {xmlMode: true})
  }

  create (xml) {
    return this._cheerio(xml)
  }

  find (selector) {
    return this._cheerio(selector)
  }

  dump (pretty = true) {
    let content = this._cheerio.xml()
    if (pretty) {
      content = beautifyHtml(content, {
        indent_size: 2,
        void_elements: [], // No, 'self-closing', void tags for XML
        unformatted: [] // Format all tags
      })
    }
    return content
  }
}
