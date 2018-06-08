const DocumentMdConverter = require('../../src/document/DocumentMdConverter')
const helpers = require('../helpers')

const converter = new DocumentMdConverter()
const { testImport, testExport } = helpers(converter, 'document')

testImport('paragraph/md/paragraph-import.md', 'paragraph/dar/paragraph.jats.xml', {complete: false})
testExport('paragraph/dar/paragraph.jats.xml', 'paragraph/md/paragraph-export.md', {complete: false})

testImport('inlines/md/inlines-import.md', 'inlines/dar/inlines.jats.xml', {complete: false})

testImport('heading/md/heading-import.md', 'heading/dar/heading.jats.xml', {complete: false})
testExport('heading/dar/heading.jats.xml', 'heading/md/heading-export.md', {complete: false})

testImport('figure/md/figure-import.md', 'figure/dar/figure.jats.xml', {complete: false})

testImport('table/md/table-import.md', 'table/dar/table.jats.xml', {complete: false})

testImport('codeblocks/md/codeblocks.md', 'codeblocks/dar/codeblocks.jats.xml', {complete: false})
