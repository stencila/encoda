const PandocConverter = require('./PandocConverter')

class HTMLConverter extends PandocConverter {
  id () {
    return 'html'
  }

  options () {
    return Object.assign(super.options(), {
      from: 'html',

      to: 'html'
    })
  }

  async export (doc, path, volume, options = {}) {
    // HTML documents must have a title
    if (!doc.front) doc.front = {}
    if (!doc.front.title) {
      doc.front.title = {
        type: 'Para',
        nodes: [
          {type: 'String', data: 'Untitled'}
        ]
      }
    }

    return super.export(doc, path, volume, options)
  }
}

module.exports = HTMLConverter
