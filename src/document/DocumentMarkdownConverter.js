const DocumentPandocConverter = require('./DocumentPandocConverter')

class DocumentMarkdownConverter extends DocumentPandocConverter {
  pandocFormat () {
    return [
      'markdown_github',
      'yaml_metadata_block',
      'implicit_figures',
      'bracketed_spans',
      'backtick_code_blocks',
      'fenced_code_attributes',
      'definition_lists',
      'fenced_divs',
      'multiline_tables'
    ].join('+')
  }
}

module.exports = DocumentMarkdownConverter
