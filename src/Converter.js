const cheerio = require('cheerio')
const fs = require('fs')
const memfs = require('memfs')
const mkdirp = require('mkdirp')
const path = require('path')
const beautifyHtml = require('js-beautify').html

class Converter {
  matchExtensions (pathFrom, extensions) {
    const ext = path.extname(pathFrom).substring(1)
    return Promise.resolve(
      extensions.indexOf(ext) > -1
    )
  }

  canImport (pathFrom, volumeFrom) {
    return Promise.resolve(false)
  }

  canExport (pathTo, volumeTo) {
    return Promise.resolve(false)
  }

  get fileInternal () {
    return 'internal.txt'
  }

  get fileExternal () {
    return 'external.txt'
  }

  /**
   * Prepare arguments for import or export
   *
   * @param  {boolean} importing  Is this preparing for an import?
   * @param  {string}  pathFrom   The path to import/export from
   * @param  {string}  pathTo     The path to import/export to
   * @param  {fs}      volumeFrom File system to import/export from
   * @param  {fs}      volumeTo   File system to import/export to
   * @return {Promise}            Resolves to updated `{pathFrom, pathTo, volumeFrom, volumeTo}`
   */
  prepare (importing, pathFrom, pathTo, volumeFrom, volumeTo) {
    return new Promise((resolve) => {
      if (!pathFrom) throw new Error('Parameter `pathFrom` is required')
      if (path.extname(pathFrom) === '') {
        pathFrom = path.join(pathFrom, importing ? this.fileExternal : this.fileInternal)
      }
      if (path.extname(pathTo) === '') {
        pathTo = path.join(pathTo, importing ? this.fileInternal : this.fileExternal)
      }
      volumeFrom = volumeFrom || fs
      volumeTo = volumeTo || volumeFrom
      return resolve({pathFrom, pathTo, volumeFrom, volumeTo})
    })
  }

  /**
   * Prepare arguments for import
   *
   * @see prepare
   */
  prepareImport () {
    return this.prepare(true, ...arguments)
  }

  /**
   * Prepare arguments for export
   *
   * @see prepare
   */
  prepareExport () {
    return this.prepare(false, ...arguments)
  }

  import (pathFrom, pathTo, volumeFrom, volumeTo, options = {}) {
    return this.prepareImport(...arguments).then(({ pathFrom, pathTo, volumeFrom, volumeTo }) => {
      return this.readFile(pathFrom, volumeFrom, options).then((content) => {
        return this.writeFile(pathTo, content, volumeTo, options).then(() => {
          return pathTo
        })
      })
    })
  }

  export (pathFrom, pathTo, volumeFrom, volumeTo, options = {}) {
    return this.prepareExport(...arguments).then(({ pathFrom, pathTo, volumeFrom, volumeTo }) => {
      return this.readFile(pathFrom, volumeFrom, options).then((content) => {
        return this.writeFile(pathTo, content, volumeTo, options).then(() => {
          return pathTo
        })
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
          unformatted: [] // Format all tags
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
