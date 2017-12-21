#!/usr/bin/env node

const convert = require('../src').convert

const pathFrom = process.argv[2]
const pathTo = process.argv[3]

if (!pathTo || !pathFrom) {
  console.error('Usage:\n\n  stencila-convert <from> <to>\n\ne.g.\n')
  console.error('  stencila-convert doc.md doc.jats.xml')
  console.error('  stencila-convert data.sheet.xml data.csv')
  process.exit(1)
}

convert(pathFrom, pathTo).then(() => {
  console.log(`Converted from "${pathFrom}" to "${pathTo}"`)
}).catch((error) => {
  console.error(error)
})
