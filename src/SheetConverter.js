const fs = require('fs')
const xlsx = require('xlsx')

const Converter = require('./Converter')

class SheetConverter extends Converter {
  id () {
    return 'sheet'
  }

  async import (path, volume = fs, options = {}) {
    const exedoc = {
      type: 'Document',
      body: []
    }

    let workbook
    if (volume === fs) workbook = xlsx.readFile(path)
    else {
      const content = volume.readFileSync(path, 'utf8')
      console.log(content)
      workbook = xlsx.read(content, {type: 'string'})
    }

    const worksheet = workbook.Sheets[workbook.SheetNames[0]] // Currently, only importing first sheet
    const cellRange = xlsx.utils.decode_range(worksheet['!ref'])
    const columns = []
    const data = []
    for (let r = 0; r <= cellRange.e.r; r++) {
      if (r === 0) {
        for (let c = 0; c <= cellRange.e.c; c++) {
          let column = dom('<col>')
          if (options.header) {
            const ref = xlsx.utils.encode_cell({r: r, c: c})
            const header = worksheet[ref]
            if (header) column.attr('name', header.v)
          }
          columns.push(column)
        }
        if (options.header) continue
      }
      const row = dom('<row>')
      for (let c = 0; c <= cellRange.e.c; c++) {
        const ref = xlsx.utils.encode_cell({r: r, c: c})
        const cell = worksheet[ref]
        if (cell) {
          let cellEl = dom('<cell>')
          if (cell.f) {
            cellEl.attr('language', 'mini')
            cellEl.text('=' + cell.f)
          } else {
            if (typeof cell.v === 'string') {
              let match = cell.v.match(/^(r|py|js)=(.*)/)
              if (match) {
                cellEl.attr('language', match[1])
                cellEl.text('=' + match[2])
              } else {
                cellEl.text(cell.v)
              }
            } else {
              cellEl.text(cell.v)
            }
          }
          row.push(cellEl)
        }
      }
      data.push(row)
    }

    return exedoc
  }

  export (pathFrom, pathTo, volumeFrom, volumeTo) {
    volumeFrom = volumeFrom || fs
    volumeTo = volumeTo || volumeFrom

    return this.readXml(pathFrom).then((dom) => {
      // The `xlsx` library seems to work best reading from file (rather than parsing data)
      // so for now only support local files
      if (volumeFrom !== fs) throw new Error('Only able to read from a local file system volume')
      if (volumeTo !== fs) throw new Error('Only able to write to a local file system volume')

      const cells = {}
      const data = dom('data')
      let end = {r: 0, c: 0}
      data.find('row').each((r, elem) => {
        let row = dom(elem)
        row.find('cell').each((c, elem) => {
          let cell = dom(elem)
          const text = cell.text()
          if (text) {
            const ref = xlsx.utils.encode_cell({r: r, c: c})
            cells[ref] = {
              t: 's',
              v: text
            }
            end = {r: r, c: c}
          }
        })
      })
      cells['!ref'] = xlsx.utils.encode_range({
        s: {r: 0, c: 0},
        e: end
      })

      const workbook = {
        SheetNames: ['Sheet1'],
        Sheets: {
          Sheet1: cells
        }
      }

      return new Promise((resolve, reject) => {
        xlsx.writeFileAsync(pathTo, workbook, {
          type: 'string'
        }, (err) => {
          err ? reject(err) : resolve(pathTo)
        })
      })
    })
  }
}

module.exports = SheetConverter
