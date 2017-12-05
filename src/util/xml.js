import cheerio from 'cheerio'
import {html as beautifyHtml} from 'js-beautify'

function load (xml) {
  return cheerio.load(xml, {xmlMode: true})
}

function dump (dom, pretty = true) {
  let content = dom.xml()
  if (pretty) {
    content = beautifyHtml(content, {
      indent_size: 2,
      void_elements: [], // No, 'self-closing', void tags for XML
      unformatted: [] // Format all tags
    })
  }
  return content
}

export default { load, dump }
