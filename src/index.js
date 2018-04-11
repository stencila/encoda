const projectConverters = require('./project')
const documentConverters = require('./document')
const sheetConverters = require('./sheet')

let converters = [].concat(
  Object.values(projectConverters),
  Object.values(documentConverters),
  Object.values(sheetConverters)
)

function import_ (pathFrom, pathTo, volumeFrom, volumeTo) {
  return Promise.resolve().then(() => {
    function check (index = 0) {
      const Converter = converters[index]
      if (!Converter) throw new Error('No converters can import from ' + pathFrom)
      let converter = new Converter()
      return converter.canImport(pathFrom, volumeFrom).then((can) => {
        return can ? converter.import(pathFrom, pathTo, volumeFrom, volumeTo) : check(index + 1)
      })
    }
    return check()
  })
}

function export_ (pathFrom, pathTo, volumeFrom, volumeTo) {
  return Promise.resolve().then(() => {
    function check (index = 0) {
      const Converter = converters[index]
      if (!Converter) throw new Error('No converters can export from ' + pathFrom)
      let converter = new Converter()
      return converter.canExport(pathTo, volumeTo).then((can) => {
        return can ? converter.export(pathFrom, pathTo, volumeFrom, volumeTo) : check(index + 1)
      })
    }
    return check()
  })
}

function convert (pathFrom, pathTo, volumeFrom, volumeTo) {
  return import_(pathFrom, null, volumeFrom, volumeTo).then((pathImportedTo, volumeImportedTo) => {
    return export_(pathImportedTo, pathTo, volumeImportedTo, volumeTo)
  })
}

module.exports = {
  'import': import_,
  'export': export_,
  convert
}
