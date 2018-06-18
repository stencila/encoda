const fs = require('fs')

const pandoc = require('./helpers/pandoc')

const DarConverter = require('./DarConverter')
const DOCXConverter = require('./DOCXConverter')
const EDFConverter = require('./EDFConverter')
const FolderConverter = require('./FolderConverter')
const JATSConverter = require('./JATSConverter')
const HTMLConverter = require('./HTMLConverter')
const JSONConverter = require('./JSONConverter')
const LatexConverter = require('./LatexConverter')
const MarkdownConverter = require('./MarkdownConverter')
const ODTConverter = require('./ODTConverter')
const PDFConverter = require('./PDFConverter')
const PandocConverter = require('./PandocConverter')

let converters = [
  // Order is important for matching.
  // First matching converter is used

  // Text document converters
  new DOCXConverter(),
  new JATSConverter(),
  new HTMLConverter(),
  new LatexConverter(),
  new MarkdownConverter(),
  new ODTConverter(),
  new PDFConverter(),
  new PandocConverter(),

  // Sheet document converters

  // Folder converters
  new DarConverter(),
  new EDFConverter(),
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
  return null
}

async function convert (pathFrom, pathTo, volumeFrom, volumeTo, formatFrom, formatTo, options) {
  if (!volumeFrom) volumeFrom = fs
  if (!volumeTo) volumeTo = volumeFrom

  const importer = await match(pathFrom, volumeFrom, formatFrom, 'import', true)
  if (!importer) {
    if (formatFrom) throw new Error(`No converter for format "${formatFrom}"`)
    else throw new Error(`No converter for path "${pathFrom}"`)
  }

  const doc = await importer.import(pathFrom, volumeFrom, options)

  const exporter = await match(pathTo, volumeTo, formatTo, 'export', true)
  if (!exporter) {
    if (formatTo) throw new Error(`No converter for format "${formatTo}"`)
    else throw new Error(`No converter for path "${pathTo}"`)
  }

  await exporter.export(doc, pathTo, volumeTo, options)
}

module.exports = {
  setup,
  match,
  convert
}
