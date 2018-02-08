#!/usr/bin/env node

const convert = require('../src')

const operation = process.argv[2]
const pathFrom = process.argv[3]
const pathTo = process.argv[4]

if (!pathTo || !pathFrom) {
  console.error('Usage:\n\n  stencila-convert [import|export|convert] <from> <to>\n\ne.g.\n')
  console.error('  stencila-convert import doc.md doc.jats.xml')
  console.error('  stencila-convert export data.sheet.xml data.csv')
  console.error('  stencila-convert convert doc.md doc.pdf')
  process.exit(1)
}

convert[operation](pathFrom, pathTo).then(() => {
  console.log(`Success: ${operation} from "${pathFrom}" to "${pathTo}"`)
}).catch((error) => {
  console.error(error.stack)
})
