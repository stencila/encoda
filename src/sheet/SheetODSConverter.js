import JSZip from 'jszip'
import path_ from 'path'

import SheetConverter from './SheetConverter'
import xml from '../util/xml'
import fs from '../util/fs'

/**
 * Converter to import/export a Sheet from/to an Open Document Spreadsheet (ODS) file
 *
 */
export default class SheetODSConverter extends SheetConverter {
  /**
   * @override
   */
  match (path) {
    return new Promise((resolve) => {
      const ext = path_.extname(path)
      return resolve(ext === '.ods')
    })
  }

  /**
   * @override
   */
  import (from, to, fromFs = fs, toFs = fs) {
    return Promise.resolve().then(() => {
      // Handling parsing of unzipped XML during development
      if (from.slice(-11) === 'content.xml') {
        return fromFs.readFileAsync(from, 'utf8')
      } else {
        return fromFs.readFileAsync(from).then((data) => {
          return JSZip.loadAsync(data)
        }).then((zip) => {
          return zip.file('content.xml').async('string')
        })
      }
    }).then(content => {
      const ods = xml.load(
        // Replace semicolon of tag namespacing with an underscore to allow use
        // of CSS selectors e.g.
        //   office:document-content
        // becomes
        //   office_document-content
        content.replace(/<(\/?)([a-z]+):/g, '<$1$2_')
      )

      const sheet = this.load()
      const sheetData = sheet('data')

      const odsTable = ods('office_document-content office_body office_spreadsheet table_table')
      odsTable.find('table_table-row').each((index, elem) => {
        const odsRow = ods(elem)
        const sheetRow = sheet('<row>')
        odsRow.find('table_table-cell').each((index, elem) => {
          const odsCell = ods(elem)
          const text = odsCell.find('text_p').text()
          const sheetCell = sheet('<cell>').text(text)
          sheetRow.append(sheetCell)
        })
        sheetData.append(sheetRow)
      })

      return toFs.writeFileAsync(
        path_.join(to, 'index.sheet.xml'),
        this.dump(sheet)
      )
    })
  }
}
