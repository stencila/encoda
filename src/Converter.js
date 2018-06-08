const beautifyHtml = require('js-beautify').html
const cheerio = require('cheerio')
const fs = require('fs')
const memfs = require('memfs')
const mkdirp = require('mkdirp')
const path = require('path')
const tmp = require('tmp')

/**
 * Base converter class
 */
class Converter {
  extensions () {
    return []
  }

  async matchExtensions (pathFrom, extensions) {
    const ext = path.extname(pathFrom).substring(1).toLowerCase()
    return extensions.indexOf(ext) > -1
  }

  async canImport (pathFrom, volumeFrom) {
    return this.matchExtensions(pathFrom, this.extensions())
  }

  async canExport (pathTo, volumeTo) {
    return this.matchExtensions(pathTo, this.extensions())
  }

  async import (pathFrom, pathTo, volumeFrom, volumeTo, options = {}) {
    pathTo = pathTo || tmp.tmpNameSync()
    volumeFrom = volumeFrom || fs
    volumeTo = volumeTo || volumeFrom

    const content = await this.readFile(pathFrom, volumeFrom, options)
    await this.writeFile(pathTo, content, volumeTo, options)
    return pathTo
  }

  async export (pathFrom, pathTo, volumeFrom, volumeTo, options = {}) {
    pathTo = pathTo || tmp.tmpNameSync()
    volumeFrom = volumeFrom || fs
    volumeTo = volumeTo || volumeFrom

    const content = await this.readFile(pathFrom, volumeFrom, options)
    await this.writeFile(pathTo, content, volumeTo, options)
    return pathTo
  }

  async load (content, options = {}) {
    const volume = new memfs.Volume()
    await this.writeFile('/content.tmp', content, volume, options)
    const path = await this.import('/content.tmp', '/imported.tmp', volume, volume, options)
    return this.readFile(path, volume)
  }

  async dump (content, options = {}) {
    const volume = new memfs.Volume()
    await this.writeFile('/content.tmp', content, volume, options)
    const path = await this.export('/content.tmp', '/exported.tmp', volume, volume, options)
    return this.readFile(path, volume)
  }

  async readFile (path, volume = fs, options = {}) {
    if (!options.encoding) options.encoding = 'utf8'

    return new Promise((resolve, reject) => {
      volume.readFile(path, options, (err, data) => {
        if (err) reject(err)
        else resolve(data)
      })
    })
  }

  async writeFile (path_, data, volume = fs, options = {}) {
    if (!options.encoding) options.encoding = 'utf8'

    return new Promise((resolve, reject) => {
      const dir = path.dirname(path_)
      mkdirp(dir, { fs: volume }, (err) => {
        if (err) reject(err)
        volume.writeFile(path_, data, options, (err) => {
          if (err) reject(err)
          else resolve()
        })
      })
    })
  }

  async loadXml (xml) {
    // Remove any XML declaration as it interfers
    // with indenting (but add it back on dumpXml)
    let match = xml.match(/<\?xml[^>]+>/)
    if (match) xml = xml.replace(match[0], '')
    return cheerio.load(xml, {xmlMode: true})
  }

  async dumpXml (dom, options = {}) {
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

  async readXml (path, volume = fs, options = {}) {
    const xml = await this.readFile(path, volume, options)
    return this.loadXml(xml)
  }

  async writeXml (path, dom, volume = fs, options = {}) {
    const xml = await this.dumpXml(dom, options)
    return this.writeFile(path, xml, volume, options)
  }
}

module.exports = Converter
