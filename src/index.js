const fs = require('fs')

const pandoc = require('./helpers/pandoc')

const DarConverter = require('./DarConverter')
const FolderConverter = require('./FolderConverter')
const JATSConverter = require('./JATSConverter')
const JSONConverter = require('./JSONConverter')
const MarkdownConverter = require('./MarkdownConverter')
const PandocConverter = require('./PandocConverter')

let converters = [
  // Order is important for matching.
  // First matching converter is used

  // Text document converters
  new JATSConverter(),
  new MarkdownConverter(),
  new PandocConverter(),

  // Sheet document converters

  // Folder converters
  new DarConverter(),
  new FolderConverter(),

  // Base, "no-op" converter (can be useful for debugging; convert to '.json')
  new JSONConverter()
]

async function setup () {
  pandoc.setup()
}

async function match (path, volume, format, direction) {
  let method
  if (direction === 'import') method = 'importable'
  else if (direction === 'export') method = 'exportable'
  else method = 'match'
  for (let converter of converters) {
    if (await converter[method](path, volume, format)) return converter
  }
  if (format) throw new Error(`No converter for format "${format}"`)
  else throw new Error(`No converter for path "${path}"`)
}

async function convert (pathFrom, pathTo, volumeFrom, volumeTo, formatFrom, formatTo, options) {
  if (!volumeFrom) volumeFrom = fs
  if (!volumeTo) volumeTo = volumeFrom

  const importer = await match(pathFrom, volumeFrom, formatFrom, 'import')
  const doc = await importer.import(pathFrom, volumeFrom, options)
  const exporter = await match(pathTo, volumeTo, formatTo, 'export')
  await exporter.export(doc, pathTo, volumeTo, options)
}

module.exports = {
  setup,
  match,
  convert
}
