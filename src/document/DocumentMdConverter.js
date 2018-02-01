const DocumentPandocConverter = require('./DocumentPandocConverter')

class DocumentMdConverter extends DocumentPandocConverter {
  extensions () {
    return ['md']
  }

  pandocImportFormat () {
    // Support various extensions when reading
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

  pandocExportFormat () {
    // Use the closest thing to a Markdown standard for export
    return 'commonmark'
  }

  pandocExportArgs (options) {
    return super.pandocExportArgs(options).concat([
      '--columns=100', // Text wrapping width (for discussion on optimum see https://www.viget.com/articles/the-line-length-misconception/)
      '--atx-headers'  // Use ATX (#) headers
    ])
  }
}

module.exports = DocumentMdConverter
