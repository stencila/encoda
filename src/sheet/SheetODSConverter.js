const JSZip = require('jszip')

const SheetConverter = require('./SheetConverter')

/**
 * Converter to import/export a Sheet from/to an Open Document Spreadsheet (ODS) file
 *
 */
class SheetODSConverter extends SheetConverter {
  /**
   * @override
   */
  match (path) {
    return this.matchExtensions(path, 'ods')
  }

  /**
   * @override
   */
  import (pathFrom, pathTo, volumeFrom, volumeTo, options = {}) {
    return this.prepareImport(...arguments).then(({ pathFrom, pathTo, volumeFrom, volumeTo }) => {
      return Promise.resolve().then(() => {
        // Handling parsing of unzipped XML during development
        if (pathFrom.slice(-11) === 'content.xml') {
          return this.readFile(pathFrom, volumeFrom, options)
        } else {
          return this.readFile(pathFrom, volumeFrom, { encoding: 'binary' }).then((data) => {
            return JSZip.loadAsync(data)
          }).then((zip) => {
            return zip.file('content.xml').async('string')
          })
        }
      }).then(content => {
        return this.loadXml(
          // Replace semicolon of tag namespacing with an underscore to allow use
          // of CSS selectors e.g.
          //   office:document-content
          // becomes
          //   office_document-content
          content.replace(/<(\/?)([a-z]+):/g, '<$1$2_')
        )
      }).then((ods) => {
        const odsTable = ods('office_document-content office_body office_spreadsheet table_table')
        const odsRows = odsTable.find('table_table-row')

        this.createDom().then((dom) => {
          const sheetData = dom('sheet data')
          odsRows.each((index, elem) => {
            const odsRow = ods(elem)
            const sheetRow = dom('<row>')
            odsRow.find('table_table-cell').each((index, elem) => {
              const odsCell = ods(elem)
              const text = odsCell.find('text_p').text()
              const sheetCell = dom('<cell>').text(text)
              sheetRow.append(sheetCell)
            })
            sheetData.append(sheetRow)
          })

          return this.writeXml(pathTo, dom, volumeTo).then(() => {
            return pathTo
          })
        })
      })
    })
  }
}

module.exports = SheetODSConverter
