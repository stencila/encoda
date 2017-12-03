import * as d3 from 'd3'

import SheetConverter from './SheetConverter'

/**
 * Converter to import/export a Sheet from/to a delimiter separated values (DSV) file
 *
 * There are several dialects of [DSV](https://en.wikipedia.org/wiki/Delimiter-separated_values)
 * the best known of which is CSV (comma separated values).
 *
 * Converts to/from Stencila's internal XML buffer format for Sheets
 */
export default class SheetDSVConverter extends SheetConverter {
  /**
   * @override
   */
  match (path, storer) { // eslint-disable-line
    let {ext} = this._parsePath(path)
    return Promise.resolve(['csv', 'tsv', 'psv'].indexOf(ext) >= 0)
  }

  /**
   * @override
   */
  import (path, storer, buffer) { // eslint-disable-line
    let {$sheet, $$} = this._importCreateElement()
    return this._importReadData(path, storer).then(data => {
      $sheet.append(
        this._importFieldsFromData(data, $$)
      )
      $sheet.append(
        this._importValuesFromData(data, $$)
      )
      return this._importWriteBuffer($sheet, buffer)
    })
  }

  /**
   * Helper method to read a DSV file and return
   * an array or objects
   */
  _importReadData (path, storer) {
    // Preliminary implementation to be finalised once
    // XML schema for Sheets is finalised.
    // May use an alternative CSV parser
    return storer.readFile(path).then(data => {
      return d3.csvParse(data)
    })
  }

  /**
   * Helper method to convert an array of objects
   * into a `Sheet` `<fields>` element.
   */
  _importFieldsFromData (data, $$) {
    let $fields = $$('fields')
    for (let field of Object.keys(data[0])) {
      let $value = $$('field').attr({
        name: field
      })
      $fields.append($value)
    }
    return $fields
  }

  /**
   * Helper method to convert an array of objects
   * into a `Sheet` `<values>` element.
   */
  _importValuesFromData (data, $$) {
    let $values = $$('values')
    for (let row of data) {
      let $row = $$('row')
      for (let field of Object.keys(row)) {
        let $value = $$('value').text(row[field])
        $row.append($value)
      }
      $values.append($row)
    }
    return $values
  }

  /**
   * @override
   */
  export (path, storer, buffer) { // eslint-disable-line
    throw new Error('SheetDSVConverter.export() not yet implemented')
  }
}
