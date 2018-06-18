const DSVConverter = require('./DSVConverter')

/**
 * Converter to import/export a Sheet from/to Tabular Data Package (TDP)
 *
 * @description
 *
 * The [TDP specification](https://specs.frictionlessdata.io/tabular-data-package/)
 * is a [Data Package](https://specs.frictionlessdata.io/data-package/) (represented by a
 * `datapackage.json` file) that has:
 *
 *  - at least one resource in the resources array
 *  - each resource must be a (Tabular Data Resource)[https://specs.frictionlessdata.io/tabular-data-resource/] (TDR)
 *
 * This converter converts a *single* TDR from a TDP's `datapackage.json`. The TDR can be either:
 *
 * - inline "JSON tabular data" that is array of data rows where each row is an array or object"
 * - a CSV file
 */
class TDPConverter extends DSVConverter {
  /**
   * @override
   */
  match (path, storer) {
    let {dir, file, ext} = this._parsePath(path)

    // Is this a `datapackage.json`?
    if (file === 'datapackage.json') return Promise.resolve(true)

    // Is this a CSV file with a sibling `datapackage.json`?
    if (ext === 'csv') {
      const files = storer.readDir(dir)
      for (let file of files) {
        if (file === 'datapackage.json') return true
      }
      return false
    }

    // No match
    return Promise.resolve(false)
  }

  /**
   * @override
   */
  async import (path, storer, buffer) {
    let {dir, file} = this._parsePath(path)
    let {$sheet, $$} = this._importCreateElement()

    let datapackageFile = (dir ? (dir + '/') : '') + 'datapackage.json'
    const data = storer.readFile(datapackageFile)
    let pkg = JSON.parse(data)

    // Get the resource for the imported file
    let resource
    if (file === 'datapackage.json') {
      // Currently use the first resource. In the future, the user
      // may be able to specify this
      resource = pkg.resources[0]
    } else {
      // Search for the imported file among resources
      for (let candidate of pkg.resources) {
        if (file === candidate.path) {
          resource = candidate
          break
        }
      }
    }

    // The <name> element is required
    $sheet.append($$('name').text(resource.name || resource.path || 'unnamed'))

    // The <fields> element is required
    let fieldsEl = $$('fields')
    $sheet.append(fieldsEl)
    if (resource.schema) {
      for (let field of resource.schema.fields) {
        let el = $$('field').attr({
          name: field.name || '',
          title: field.title || '',
          description: field.description || '',
          type: field.type || '',
          format: field.format || '',
          rdfType: field.rdfType || ''
        })
        fieldsEl.append(el)
      }
    }

    // Read in values
    let csvFile = (dir ? (dir + '/') : '') + 'data.csv'
    const data2 = this._importReadData(csvFile, storer)
    $sheet.append(
      this._importValuesFromData(data2, $$)
    )
    return this._importWriteBuffer($sheet, buffer)
  }

  /**
   * @override
   */
  export (path, storer, buffer) { // eslint-disable-line
    throw new Error('TDPConverter.export() not yet implemented')
  }
}

module.exports = TDPConverter
