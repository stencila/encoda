const DocumentMdConverter = require('../../src/document/DocumentMdConverter')
const helpers = require('../helpers')

const converter = new DocumentMdConverter()
const { testImport, testExport } = helpers(converter, 'document')

testImport('paragraph/md/paragraph-import.md', 'paragraph/stencila/paragraph.jats.xml', {complete: false})
testExport('paragraph/stencila/paragraph.jats.xml', 'paragraph/md/paragraph-export.md', {complete: false})

testImport('inlines/md/inlines-import.md', 'inlines/stencila/inlines.jats.xml', {complete: false})

testImport('heading/md/heading-import.md', 'heading/stencila/heading.jats.xml', {complete: false})
testExport('heading/stencila/heading.jats.xml', 'heading/md/heading-export.md', {complete: false})

testImport('figure/md/figure-import.md', 'figure/stencila/figure.jats.xml', {complete: false})

testImport('table/md/table-import.md', 'table/stencila/table.jats.xml', {complete: false})
