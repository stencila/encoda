const fs = require('fs')
const path = require('path')

const SheetConverter = require('./SheetConverter')

class SheetScriptConverter extends SheetConverter {
  import (from, to, fromFs = fs, toFs = null, options = {}) {
    toFs = toFs || fromFs

    return this.readFile(fromFs, from, 'utf8').then((content) => {
      const main = path.join(to, 'index.sheet.xml')
      return this.write(toFs, main, '').then(() => {
        return main
      })
    })
  }

  export (from, to, fromFs = fs, toFs = null, options = {}) {
    toFs = toFs || fromFs

    return this.readFile(fromFs, path.join(from, 'index.sheet.xml'), 'utf8').then((xml) => {
      const sheet = this.loadXml(xml)
      const sheetData = sheet('sheet data')

      let script = ''
      sheetData.find('cell').each((index, elem) => {
        const cell = sheet(elem)
        script += cell.text() + '\n'
      })

      const main = to
      return this.writeFile(toFs, main, script).then(() => {
        return main
      })
    })
  }
}

module.exports = SheetScriptConverter
