const fs = require('fs')
const xlsx = require('xlsx')

const Converter = require('./Converter')

class SheetConverter extends Converter {
  id () {
    return 'sheet'
  }

  options () {
    return {
      from: 'csf',
      to: 'csf'
    }
  }

  async import (path, volume = fs, options = {}) {
    options = Object.assign(this.options(), options)

    let workbook
    if (volume === fs) {
      workbook = xlsx.readFileSync(path, {
        bookType: options.from
      })
    } else {
      const content = volume.readFileSync(path, 'utf8')
      if (options.from === 'csf') {
        workbook = JSON.parse(content)
      } else {
        workbook = xlsx.read(content, {
          bookType: options.from,
          type: 'string'
        })
      }
    }

    let exedoc
    const sheetNames = workbook.SheetNames
    for (let sheetName of sheetNames) {
      const sheet = workbook.Sheets[sheetName]

      let rows = []
      const cellRange = xlsx.utils.decode_range(sheet['!ref'])
      for (let r = 0; r <= cellRange.e.r; r++) {
        let row = []
        for (let c = 0; c <= cellRange.e.c; c++) {
          const ref = xlsx.utils.encode_cell({r: r, c: c})
          const cell = sheet[ref]
          const nodes = this._importCell(cell)
          row.push(nodes)
        }
        rows.push(row)
      }

      if (sheetNames.length === 1) {
        exedoc = {
          type: 'Document',
          front: {
            name: {
              type: 'String',
              data: sheetName
            }
          },
          body: [
            {
              type: 'Table',
              rows: rows
            }
          ]
        }
      }
    }

    return exedoc
  }

  async export (exedoc, path, volume = fs, options = {}) {
    options = Object.assign(this.options(), options)

    let table = exedoc.body[0] // FIXME: get first type: 'Table'
    let sheet = {}
    let r = -1
    let c = -1
    for (let row of table.rows) {
      r += 1
      c = -1
      for (let nodes of row) {
        c += 1
        const cell = this._exportCell(nodes)
        if (!cell) continue
        const ref = xlsx.utils.encode_cell({r: r, c: c})
        sheet[ref] = cell
      }
    }
    sheet['!ref'] = xlsx.utils.encode_range({
      s: {r: 0, c: 0},
      e: {r: r, c: c}
    })

    const sheetNames = []
    const sheets = {}

    const name = (exedoc.front && exedoc.front.name && exedoc.front.name.data) || 'Untitled'
    sheetNames.push(name)
    sheets[name] = sheet

    const workbook = {
      SheetNames: sheetNames,
      Sheets: sheets
    }

    if (options.to === 'tsv') {
      let sheet = workbook.Sheets[name] // FIXME: Currently only handles first sheet
      let content = xlsx.utils.sheet_to_csv(sheet, {FS: '\t'})
      await this.writeFile(path, content, volume)
    } else if (volume === fs) {
      xlsx.writeFileSync(workbook, path, {
        bookType: options.to
      })
    } else {
      let content
      if (options.to === 'csf') {
        content = JSON.stringify(workbook)
      } else {
        content = xlsx.write(workbook, {
          bookType: options.to,
          type: 'string'
        })
      }
      await this.writeFile(path, content, volume)
    }
  }

  _importCell (cell) {
    if (!cell) {
      // Cell is empty
      return []
    } else if (cell.f) {
      return [{
        type: 'Cell',
        code: cell.f
      }]
    } else if (cell.v) {
      let type
      switch (cell.t) {
        case 'b':
          type = 'Boolean'
          break
        case 'n':
          type = 'Number'
          break
        case 's':
          type = 'String'
          break
        default:
          throw new Error(`Unhandled cell type: "${cell.t}"`)
      }
      return [{
        type,
        data: cell.v
      }]
    }
  }

  _exportCell (nodes) {
    if (nodes.length === 0) return null

    // Table cells are an array of nodes, so just
    // take the first node
    let node = nodes[0]
    // If the first node is a block (i.e. it has `nodes` e.g. `Plain`)
    // then take the first
    if (node.nodes) {
      node = node.nodes[0]
    }

    switch (node.type) {
      case 'Cell':
        return {
          f: node.code
        }
      case 'Boolean':
        return {
          t: 'b',
          v: node.data
        }
      case 'Number':
        return {
          t: 'n',
          v: node.data
        }
      case 'String':
        return {
          t: 's',
          v: node.data
        }
      default:
        throw new Error(`Unhandled node type: "${node.type}"`)
    }
  }
}

module.exports = SheetConverter
