const fs = require('fs')
const memfs = require('memfs')
const yaml = require('js-yaml')

const DocumentMdConverter = require('./DocumentMdConverter')

/**
 * Jupyter notebook converter for the Stencila Documents
 *
 * Converts a document from/to a Jupyter Notebook based on
 * the documentation of the notebook format at
 *
 *   https://github.com/jupyter/nbformat
 *
 * See there for JSON schemas too
 *
 *   e.g. https://github.com/jupyter/nbformat/blob/master/nbformat/v4/nbformat.v4.schema.json
 */
class DocumentJupyterConverter extends DocumentMdConverter {
  extensions () {
    return ['ipynb']
  }

  async import (pathFrom, pathTo, volumeFrom, volumeTo, options) {
    volumeFrom = volumeFrom || fs
    volumeTo = volumeTo || volumeFrom

    const json = await this.readFile(pathFrom, volumeFrom)
    let md = ''

    const data = JSON.parse(json)

    // Get notebook metadata
    let metadata = data.metadata

    // Convert metadata to YAML front matter
    md += '---\n'
    md += yaml.dump(metadata)
    md += '\n---\n'

    // Get notebook language
    let language
    if (metadata) {
      if (metadata.language_info) {
        language = metadata.language_info.name
      } else if (metadata.kernelspec) {
        language = metadata.kernelspec.language
      } else if (metadata.kernel_info) {
        language = metadata.kernel_info.language
      }
    }

    // Get cells
    let cells
    if (data.cells) {
      cells = data.cells
    } else if (data.worksheets) {
      // In nbformat 3.0 there is an array called worksheets, each having cells
      cells = data.worksheets[0].cells
    }

    // Iterate over cells
    for (let cell of cells) {
      let source = cell.source.join('')
      if (cell.cell_type === 'markdown') {
        // Ensure two new lines at end of markdown cell for proper separation
        // from following cells
        md += source + '\n\n'
      } else if (cell.cell_type === 'code') {
        // Code cells as Pandoc `backtick_code_blocks` with `fenced_code_attributes`
        // to store language and indicate an executable cell
        // Remove any trailing newline, otherwise we get an extra line in source
        if (source.slice(-1) === '\n') source = source.slice(0, -1)
        // Use the `code-type` JATS valid attribute to indicate a Jupyter cell
        md += '\n``` {.' + language + ' code-type="jupyter" executable="yes"}\n' + source + '\n```\n'
      }
    }

    const volumeTemp = new memfs.Volume()
    await this.writeFile(pathFrom, md, volumeTemp)
    return super.import(pathFrom, pathTo, volumeTemp, volumeTo, options)
  }
}

module.exports = DocumentJupyterConverter
