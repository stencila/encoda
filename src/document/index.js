const DocumentConverter = require('./DocumentConverter')
const DocumentPandocConverter = require('./DocumentPandocConverter')

const DocumentDocxConverter = require('./DocumentDocxConverter')
const DocumentHtmlConverter = require('./DocumentHtmlConverter')
const DocumentLatexConverter = require('./DocumentLatexConverter')
const DocumentMdConverter = require('./DocumentMdConverter')
const DocumentOdtConverter = require('./DocumentOdtConverter')
const DocumentJupyterConverter = require('./DocumentJupyterConverter')
const DocumentRmdConverter = require('./DocumentRmdConverter')
const DocumentPdfConverter = require('./DocumentPdfConverter')

module.exports = {
  DocumentConverter,
  DocumentPandocConverter,

  DocumentDocxConverter,
  DocumentHtmlConverter,
  DocumentLatexConverter,
  DocumentMdConverter,
  DocumentOdtConverter,
  DocumentJupyterConverter,
  DocumentRmdConverter,
  DocumentPdfConverter
}
