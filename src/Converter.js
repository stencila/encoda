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

  matchExtensions (pathFrom, extensions) {
    const ext = path.extname(pathFrom).substring(1)
    return Promise.resolve(
      extensions.indexOf(ext) > -1
    )
  }

  canImport (pathFrom) {
    return this.matchExtensions(pathFrom, this.extensions())
  }

  canExport (pathTo) {
    return this.matchExtensions(pathTo, this.extensions())
  }

  import (pathFrom, pathTo, volumeFrom, volumeTo, options = {}) {
    pathTo = pathTo || tmp.tmpNameSync()
    volumeFrom = volumeFrom || fs
    volumeTo = volumeTo || volumeFrom

    return this.readFile(pathFrom, volumeFrom, options).then((content) => {
      return this.writeFile(pathTo, content, volumeTo, options).then(() => {
        return pathTo
      })
    })
  }

  export (pathFrom, pathTo, volumeFrom, volumeTo, options = {}) {
    pathTo = pathTo || tmp.tmpNameSync()
    volumeFrom = volumeFrom || fs
    volumeTo = volumeTo || volumeFrom

    return this.readFile(pathFrom, volumeFrom, options).then((content) => {
      return this.writeFile(pathTo, content, volumeTo, options).then(() => {
        return pathTo
      })
    })
  }

  load (content, options = {}) {
    const volume = new memfs.Volume()
    return this.writeFile('/content.tmp', content, volume, options).then(() => {
      return this.import('/content.tmp', '/imported.tmp', volume, volume, options).then((path) => {
        return this.readFile(path, volume)
      })
    })
  }

  dump (content, options = {}) {
    const volume = new memfs.Volume()
    return this.writeFile('/content.tmp', content, volume, options).then(() => {
      return this.export('/content.tmp', '/exported.tmp', volume, volume, options).then((path) => {
        return this.readFile(path, volume)
      })
    })
  }

  readFile (path, volume = fs, options = {}) {
    if (!options.encoding) options.encoding = 'utf8'

    return new Promise((resolve, reject) => {
      volume.readFile(path, options, (err, data) => {
        if (err) reject(err)
        else resolve(data)
      })
    })
  }

  writeFile (path_, data, volume = fs, options = {}) {
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

  loadXml (xml) {
    return Promise.resolve(
      cheerio.load(xml, {xmlMode: true})
    )
  }

  dumpXml (dom, options = {}) {
    return new Promise((resolve, reject) => {
      if (options.pretty !== false) options.pretty = true

      let content = dom.xml()
      if (options.pretty) {
        content = beautifyHtml(content, {
          indent_size: 2,
          void_elements: [], // No, 'self-closing', void tags for XML
          unformatted: ['?xml'].concat(options.tagsUnformatted || []),
          content_unformatted: options.tagsContentUnformatted || []
        })
      }
      return resolve(content)
    })
  }

  readXml (path, volume = fs, options = {}) {
    return this.readFile(path, volume, options).then((xml) => {
      return this.loadXml(xml)
    })
  }

  writeXml (path, dom, volume = fs, options = {}) {
    return this.dumpXml(dom, options).then((xml) => {
      return this.writeFile(path, xml, volume, options)
    })
  }
}

module.exports = Converter
