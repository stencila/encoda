const beautifyHtml = require('js-beautify').html
const cheerio = require('cheerio')

function load (xml) {
  // Remove any XML declaration as it interfers
  // with indenting
  let match = xml.match(/<\?xml[^>]+>/)
  if (match) xml = xml.replace(match[0], '')
  return cheerio.load(xml, {xmlMode: true})
}

function dump (dom, options = {}) {
  if (options.pretty !== false) options.pretty = true

  let content = dom.xml()
  if (options.pretty) {
    content = beautifyHtml(content, {
      indent_size: 2,
      void_elements: [], // No, 'self-closing', void tags for XML
      unformatted: [].concat(options.tagsUnformatted || []),
      content_unformatted: options.tagsContentUnformatted || []
    })
  }
  if (options.declaration) content = '<?xml version="1.0" encoding="UTF-8"?>\n' + content
  return content
}

module.exports = {
  load,
  dump
}
