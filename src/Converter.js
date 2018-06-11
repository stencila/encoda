const fs = require('fs')
const memfs = require('memfs')
const mkdirp = require('mkdirp')
const path = require('path')

/**
 * Base converter class
 */
class Converter {
  id () {
    throw new Error(`Class ${this.constructor.name} should implement 'id'`)
  }

  extensions () {
    return [this.id()]
  }

  match (path_, volume, format) {
    if (format) {
      return this.id() === format
    } else {
      let match = path.basename(path_).match(/^([^.]+)\.(.+)$/)
      if (match) {
        let ext = match[2].toLowerCase()
        return this.extensions().indexOf(ext) > -1
      }
      return false
    }
  }

  async load (content, options = {}) {
    const path = '/content.tmp'
    const volume = new memfs.Volume()
    await this.writeFile(path, content, volume, options)
    return this.import(path, volume, options)
  }

  async dump (doc, options = {}) {
    const path = '/content.tmp'
    const volume = new memfs.Volume()
    await this.export(doc, path, volume, options)
    return this.readFile(path, volume, options)
  }

  async round (doc, options = {}) {
    const path = '/content.tmp'
    const volume = new memfs.Volume()
    await this.export(doc, path, volume, options)
    return this.import(path, volume, options)
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
}

module.exports = Converter
