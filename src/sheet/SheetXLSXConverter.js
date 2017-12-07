const { DefaultDOMElement } = require('substance')
const JSZip = require('jszip')

const SheetConverter = require('./SheetConverter')

/**
 * Converter to import/export a Sheet from/to an XSLX files
 *
 */
class SheetXLSXConverter extends SheetConverter {
  /**
   * @override
   */
  match (path) {
    let {ext} = this._parsePath(path)
    return Promise.resolve(ext === 'xlsx')
  }

  /**
   * @override
   */
  import (path, storer, buffer) {
    return storer.readFile(path).then(data => {
      return JSZip.loadAsync(data)
    }).then(zip => {
      return zip.file('xl/worksheets/sheet1.xml').async('string').then(worksheet => {
        return zip.file('xl/sharedStrings.xml').async('string').then(sharedStrings => {
          let $sheet = this._importSheetFromWorksheet(worksheet, sharedStrings)
          return this._importWriteBuffer($sheet, buffer)
        })
      })
    })
  }

  /**
   * Helper method to convert an XSLX `<worksheet>` element
   * into a Sheet `<sheet>` element.
   *
   * @param  {string} worksheet - XML string of the `xl/worksheets/sheet1.xml` file (or other sheet)
   * @param  {string} sharedStrings - XML string of the `xl/sharedStrings.xml` file
   * @return {DOMElement}
   */
  _importSheetFromWorksheet (worksheet, sharedStrings) {
    let {$sheet, $$} = this._importCreateElement()
    let $fields = $$('fields')
    let $values = $$('values')

    let $worksheet = DefaultDOMElement.parseXML(worksheet).find('worksheet')

    // Create an array of strings to access as cell values
    let $sst = DefaultDOMElement.parseXML(sharedStrings).find('sst')
    let strings = $sst.getChildren().map($si => $si.find('t').text())

    let $sheetData = $worksheet.find('sheetData')
    let rowNum = 0
    for (let $row of $sheetData.findAll('row')) {
      let headerRow = false
      let $row_ = $$('row')
      let colNum = 0
      for (let $c of $row.findAll('c')) {
        let value = $c.text()
        let type = $c.attr('t')

        // If necessary convert the value to corresponding type
        if (type === 's') {
          value = strings[value]
        }

        // If the first colmn of the first row is a string then we
        // assume it is a header row and use it for field names
        if (!headerRow && rowNum === 0 && colNum === 0 && type === 's') {
          headerRow = true
        }

        if (headerRow) {
          let $field = $$('field').attr('name', value)
          $fields.append($field)
        } else {
          let $value = $$('value').text(value)
          $row_.append($value)
        }

        colNum = colNum + 1
      }
      if (!headerRow) $values.append($row_)

      rowNum = rowNum + 1
    }
    $sheet.append($fields)
    $sheet.append($values)

    return $sheet
  }

  /**
   * @override
   */
  export (path, storer, buffer) { // eslint-disable-line
    throw new Error('SheetXLSXConverter.export() not yet implemented')
  }
}

module.exports = SheetXLSXConverter
