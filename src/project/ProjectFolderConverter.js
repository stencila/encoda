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

  import (pathFrom, pathTo, volumeFrom = fs, volumeTo = null, options = {}) {
    pathTo = pathTo || pathFrom
    volumeTo = volumeTo || volumeFrom
    options.include = options.include || '*'

    return new Promise((resolve, reject) => {
      // Get the list of files in the directory using the `include` and `exclude`
      // glob options
      glob(path.join(pathFrom, options.include), {
        ignore: options.exclude
      }, (err, files) => {
        if (err) return reject(err)

        // If a file can be imported then import it recording source and destination file paths
        const converters = this.converters
        const promises = []
        function conversionPromise (filePathFrom, index = 0) {
          const Converter = converters[index]
          if (!Converter) return Promise.resolve({pathTo: null})
          let converter = new Converter()
          return converter.canImport(filePathFrom, volumeFrom).then((can) => {
            if (!can) return conversionPromise(filePathFrom, index + 1)
            else return converter.import(filePathFrom, null, volumeFrom, volumeTo)
          })
        }
        for (let filePathFrom of files) promises.push(conversionPromise(filePathFrom))

        // Create project manifest
        Promise.all(promises).then(conversions => {
          return this.createDom().then(manifest => {
            let documents = manifest('documents')
            for (let conversion of conversions) {
              if (!conversion.pathTo) continue
              const filePathTo = path.relative(pathFrom, conversion.pathTo)
              const filePathFrom = path.relative(pathFrom, conversion.pathFrom)
              const type = conversion.formatTo
              const id = filePathFrom
              const name = filePathFrom
              documents.append(`<document id="${id}" name="${name}" type="${type}" path="${filePathTo}" src="${filePathFrom}" />`)
            }
            return this.writeXml(path.join(pathTo, 'manifest.xml'), manifest)
          })
        })
      })
    })
  }
}

module.exports = ProjectFolderConverter
