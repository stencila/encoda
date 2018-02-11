const fs = require('fs')
const memfs = require('memfs')
const yaml = require('js-yaml')
const yamlFront = require('yaml-front-matter')

const DocumentPandocConverter = require('./DocumentPandocConverter')

class DocumentMdConverter extends DocumentPandocConverter {
  extensions () {
    return ['md']
  }

  pandocImportFormat () {
    return 'markdown'
    /*
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
    */
  }

  pandocImportArgs (options) {
    return super.pandocImportArgs(options).concat([
      '--filter=pandoc-citeproc'
    ])
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

  import (pathFrom, pathTo, volumeFrom, volumeTo, options = {}) {
    // Process any YAML front matter by translating any aliases
    return this.readFile(pathFrom, volumeFrom || fs).then((md) => {
      let front = yamlFront.loadFront(md)

      let author = front.author || front.authors
      if (author) {
        author = author.map(author => {
          return {
            'surname': author['surname'],
            'given-names': author['given-names'],
            'aff-id': author['aff-id'] || author['affiliation']
          }
        })
        front.author = author
        if (front.authors) front.authors = undefined
      }

      let orgs = front.orgs || front.organisations
      if (orgs) {
        front.orgs = orgs
        if (front.organisations) front.organisations = undefined
      }

      let mdNew = `---\n${yaml.dump(front)}\n---\n\n${front.__content}`

      const volumeTemp = new memfs.Volume()
      return this.writeFile(pathFrom, mdNew, volumeTemp).then(() => {
        return super.import(pathFrom, pathTo, volumeTemp, volumeTo, options)
      })
    })
  }
}

module.exports = DocumentMdConverter
