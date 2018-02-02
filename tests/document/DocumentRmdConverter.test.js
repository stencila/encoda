const DocumentRmdConverter = require('../../src/document/DocumentRmdConverter')
const helpers = require('../helpers')

const converter = new DocumentRmdConverter()
const { testImport } = helpers(converter, 'document')

testImport('r-notebook/rmd/r-notebook.rmd', 'r-notebook/dar/r-notebook.jats.xml')
