const fs = require('fs')

let converters = [
  require('./JSONConverter')
]

async function match (path, volume, format) {
  for (let converter of converters) {
    if (await converter.match(path, volume, format)) return converter
  }
  if (format) throw new Error(`No converter for format "${format}"`)
  else throw new Error(`No converter for path "${path}"`)
}

async function convert (pathFrom, pathTo, volumeFrom, volumeTo, formatFrom, formatTo) {
  if (!volumeFrom) volumeFrom = fs
  if (!volumeTo) volumeTo = volumeFrom

  const importer = await match(pathFrom, volumeFrom, formatFrom)
  const doc = await importer.import(pathFrom, volumeFrom)
  const exporter = await match(pathTo, volumeTo, formatTo)
  await exporter.export(doc, pathTo, volumeTo)
}

module.exports = {
  match,
  convert
}
