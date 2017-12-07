const documentConverters = require('./document')
const sheetConverters = require('./sheet')
const functionConverters = require('./function')

let converters = [].concat(
  Object.values(documentConverters),
  Object.values(sheetConverters),
  Object.values(functionConverters)
)

function import_ (pathFrom, pathTo, volumeFrom, volumeTo) {
  return new Promise((resolve, reject) => {
    function check (index = 0) {
      const Converter = converters[index]
      if (!Converter) return reject(new Error('No converters can import ' + pathFrom))
      let converter = new Converter()
      converter.canImport(pathFrom, volumeFrom).then((can) => {
        if (!can) check(index + 1)
        else {
          converter.import(pathFrom, pathTo, volumeFrom, volumeTo).then((result) => {
            resolve(result)
          })
        }
      })
    }
    check()
  })
}

function export_ (pathFrom, pathTo, volumeFrom, volumeTo) {
  return new Promise((resolve, reject) => {
    function check (index = 0) {
      const Converter = converters[index]
      if (!Converter) return reject(new Error('No converters can export ' + pathFrom))
      let converter = new Converter()
      converter.canExport(pathFrom, volumeFrom).then((can) => {
        if (!can) check(index + 1)
        else {
          converter.export(pathFrom, pathTo, volumeFrom, volumeTo).then((result) => {
            resolve(result)
          })
        }
      })
    }
    check()
  })
}

function convert (pathFrom, pathTo, volumeFrom, volumeTo) {
  return import_(pathFrom, '.', volumeFrom, volumeTo).then((pathImportedTo, volumeImportedTo) => {
    return export_(pathImportedTo, pathTo, volumeImportedTo, volumeTo)
  })
}

module.exports = {
  'import': import_,
  'export': export_,
  convert
}
