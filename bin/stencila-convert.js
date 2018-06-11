#!/usr/bin/env node

// A very simple CLI for running this package.
// Intended mainly for testing, see https://github.com/stencila/cli
// for a more fully featured CLI which incorporates this package.

const convert = require('../src').convert

const pathFrom = process.argv[2]
const pathTo = process.argv[3]

if (!pathFrom) {
  console.error('Usage:')
  console.error('  stencila-convert <from> [to]\n')
  console.error('  from: path to import from')
  console.error('  to: path to export to\n')
  console.error('Examples:\n')
  console.error('  stencila-convert doc.md doc.jats.xml')
  console.error('  stencila-convert doc.jats.xml doc.md')
  process.exit(1)
}

convert(pathFrom, pathTo).then(() => {
  console.log(`Success: converted from "${pathFrom}" to "${pathTo}"`)
}).catch((error) => {
  console.error(error.stack)
})
