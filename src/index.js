const fs = require('fs')

const pandoc = require('./helpers/pandoc')

const DarConverter = require('./DarConverter')
const DOCXConverter = require('./DOCXConverter')
const DSVConverter = require('./DSVConverter')
const EDFConverter = require('./EDFConverter')
const FolderConverter = require('./FolderConverter')
const HTMLConverter = require('./HTMLConverter')
const JATSConverter = require('./JATSConverter')
const LatexConverter = require('./LatexConverter')
const MarkdownConverter = require('./MarkdownConverter')
const ODTConverter = require('./ODTConverter')
const ODSConverter = require('./ODSConverter')
const PDFConverter = require('./PDFConverter')
const PandocConverter = require('./PandocConverter')
const SheetConverter = require('./SheetConverter')
const SheetMLConverter = require('./SheetMLConverter')
const XLSXConverter = require('./XLSXConverter')

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
  new DSVConverter(),
  new ODSConverter(),
  new SheetMLConverter(),
  new XLSXConverter(),
  new SheetConverter(),

  // Folder converters
  new DarConverter(),

  // Base, "no-op" converter
  // (can be useful for debugging; to use, convert to '.edf.json' or '.edf')
  new EDFConverter(),

  // This should be last since it will import/export to any directory
  // regardless of it's exension
  new FolderConverter()
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
