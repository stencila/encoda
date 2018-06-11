const fs = require('fs')

const JSONConverter = require('./JSONConverter')
const PandocConverter = require('./PandocConverter')
const MarkdownConverter = require('./MarkdownConverter')

let converters = [
  // Order is important for matching.
  // First matching converter is used

  new MarkdownConverter(),      // .md

  new PandocConverter(),        // .pandoc.json
  new JSONConverter()           // .json
]

async function match (path, volume, format) {
  for (let converter of converters) {
    if (await converter.match(path, volume, format)) return converter
  }
  if (format) throw new Error(`No converter for format "${format}"`)
  else throw new Error(`No converter for path "${path}"`)
}

async function convert (pathFrom, pathTo, volumeFrom, volumeTo, formatFrom, formatTo, options) {
  if (!volumeFrom) volumeFrom = fs
  if (!volumeTo) volumeTo = volumeFrom

  const importer = await match(pathFrom, volumeFrom, formatFrom)
  const doc = await importer.import(pathFrom, volumeFrom, options)
  const exporter = await match(pathTo, volumeTo, formatTo)
  await exporter.export(doc, pathTo, volumeTo, options)
}

module.exports = {
  match,
  convert
}
