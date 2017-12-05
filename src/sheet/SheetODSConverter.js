import $ from 'cheerio'
import JSZip from 'jszip'
import path_ from 'path'

import SheetConverter from './SheetConverter'
import XMLDocument from '../util/XMLDocument'
import fs from '../util/fsAsync'

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
      // Replace semicolon of tag namespacing with and underscore
      const odsXml = content.replace(/<(\/?)([a-z]+):/g, '<$1$2_')
      const ods = new XMLDocument(odsXml)

      const xml = this._xmlCreate()
      const xmlData = xml.find('data')

      const odsTable = ods.find('office_document-content office_body office_spreadsheet table_table')
      odsTable.find('table_table-row').each((index, elem) => {
        const odsRow = $(elem)
        const xmlRow = xml.create('<row>')
        odsRow.find('table_table-cell').each((index, elem) => {
          const odsCell = $(elem)
          const text = odsCell.find('text_p').text()
          const xmlCell = xml.create('<cell>').text(text)
          xmlRow.append(xmlCell)
        })
        xmlData.append(xmlRow)
      })

      return toFs.writeFileAsync(path_.join(to, 'index.sheet.xml'), xml.dump() + '\n')
    })
  }
}
