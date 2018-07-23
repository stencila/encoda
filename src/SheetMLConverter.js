const fs = require('fs')

const Converter = require('./Converter')
const xml = require('./helpers/xml')

class SheetMLConverter extends Converter {
  id () {
    return 'sheetml'
  }

  extensions () {
    return ['sheetml', 'sheet.xml']
  }

  async import (path, volume = fs, options = {}) {
    options = Object.assign(this.options(), options)

    // Load XML into a DOM
    const content = await this.readFile(path, volume, options)
    const dom = xml.load(content)

    // Convert column meta data into table head
    // Currently ignoring type
    const head = []
    const columnsEl = dom('meta columns')
    columnsEl.find('col').each((c, elem) => {
      const columnEl = dom(elem)
      const name = columnEl.attr('name')
      if (name) {
        head.push([{
          type: 'Plain',
          nodes: [{
            type: 'String',
            data: name
          }]
        }])
      } else {
        head.push([])
      }
    })

    const rows = []
    const dataEl = dom('data')
    dataEl.find('row').each((r, elem) => {
      const row = []
      const rowEl = dom(elem)
      rowEl.find('cell').each((c, elem) => {
        let node
        const cellEl = dom(elem)
        const src = cellEl.attr('src')
        const text = cellEl.text()
        if (src && src[0] === '=') {
          node = {
            type: 'Cell',
            code: src,
            expr: true
          }
        } else {
          node = {
            type: 'String',
            data: text
          }
        }
        row.push([node])
      })
      rows.push(row)
    })

    return {
      type: 'Document',
      body: [
        {
          type: 'Table',
          head: head,
          rows: rows
        }
      ]
    }
  }

  async export (exedoc, path, volume = fs, options = {}) {
    options = Object.assign(this.options(), options)

    let dom = xml.load(`
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE sheet PUBLIC "DarSheet 0.1.0" "http://darformat.org/DarSheet-0.1.0.dtd">
<sheet>
  <meta>
    <columns></columns>
  </meta>
  <data></data>
</sheet>
    `)
    const dataEl = dom('data')

    let table = exedoc.body[0] // FIXME: get first type: 'Table'
    let cols = 0
    for (let row of table.rows) {
      cols = Math.max(cols, row.length)
      const rowEl = dom('<row>')
      for (let cell of row) {
        const {text} = this._exportCell(cell)
        const cellEl = dom('<cell>')
        if (text) cellEl.text(text)
        rowEl.append(cellEl)
      }
      dataEl.append(rowEl)
    }

    // Fill in <column> elements
    const columnsEl = dom('columns')
    for (let col = 0; col < cols; col++) {
      columnsEl.append(dom('<col>'))
    }

    const content = xml.dump(dom, {
      declaration: true,
      tagsContentUnformatted: ['cell']
    })
    return this.writeFile(path, content, volume, options)
  }

  _exportCell (cell) {
    if (!cell || cell.length === 0) return {text: null}
    else {
      // For now, just take first block
      const first = cell[0]
      return {text: first.data}
    }
  }
}

module.exports = SheetMLConverter
