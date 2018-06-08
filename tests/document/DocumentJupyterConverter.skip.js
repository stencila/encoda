const DocumentJupyterConverter = require('../../src/document/DocumentJupyterConverter')
const helpers = require('../helpers')

const converter = new DocumentJupyterConverter()
const { testImport } = helpers(converter, 'document')

testImport('py-notebook/ipynb/py-notebook.ipynb', 'py-notebook/dar/py-notebook.jats.xml')
