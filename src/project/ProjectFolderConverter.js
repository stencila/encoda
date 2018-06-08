const fs = require('fs')
const glob = require('glob')
const path = require('path')

const ProjectConverter = require('./ProjectConverter')

/**
 * Converts a folder (i.e. filesystem directory) into a
 * Stencila project.
 */
class ProjectFolderConverter extends ProjectConverter {
  canImport (pathFrom, volumeFrom = fs) {
    return new Promise((resolve, reject) => {
      volumeFrom.lstat(pathFrom, (err, stats) => {
        if (err) return reject(err)
        else resolve(stats.isDirectory())
      })
    })
  }

  async import (pathFrom, pathTo, volumeFrom = fs, volumeTo = null, options = {}) {
    pathTo = pathTo || pathFrom
    volumeTo = volumeTo || volumeFrom
    options.include = options.include || '*'

    // Get the list of files in the directory using the `include` and `exclude`
    // glob options
    const files = glob.sync(path.join(pathFrom, options.include), {
      ignore: options.exclude
    })

    // If a file can be imported then import it recording source and destination file paths
    const converters = this.converters
    const promises = []
    async function conversionPromise (filePathFrom, index = 0) {
      const Converter = converters[index]
      if (!Converter) return {pathTo: null}

      let converter = new Converter()
      const can = await converter.canImport(filePathFrom, volumeFrom)
      if (!can) return conversionPromise(filePathFrom, index + 1)
      else return converter.import(filePathFrom, null, volumeFrom, volumeTo)
    }
    for (let filePathFrom of files) promises.push(conversionPromise(filePathFrom))

    // Create project manifest
    Promise.all(promises).then(conversions => {
      const manifest = this.createDom()
      let documents = manifest('documents')
      for (let conversion of conversions) {
        if (!conversion.pathTo) continue
        const filePathTo = path.relative(pathFrom, conversion.pathTo)
        const filePathFrom = path.relative(pathFrom, conversion.pathFrom)
        const type = conversion.formatTo
        const id = filePathFrom
        const name = filePathFrom
        documents.append(`<document id="${id}" name="${name}" type="${type}" path="${filePathTo}"/>`)
      }
      return this.writeXml(path.join(pathTo, 'manifest.xml'), manifest)
    })
  }
}

module.exports = ProjectFolderConverter
