const fs = require('fs')
const path = require('path')

const SheetConverter = require('./SheetConverter')

class SheetScriptConverter extends SheetConverter {
  async import (from, to, fromFs = fs, toFs = null, options = {}) {
    toFs = toFs || fromFs

    const content = await this.readFile(fromFs, from, 'utf8') // eslint-disable-line
    const main = path.join(to, 'index.sheet.xml')
    await this.write(toFs, main, '')
    return main
  }

  async export (from, to, fromFs = fs, toFs = null, options = {}) {
    toFs = toFs || fromFs

    const xml = await this.readFile(fromFs, path.join(from, 'index.sheet.xml'), 'utf8')
    const sheet = this.loadXml(xml)
    const sheetData = sheet('sheet data')

    let script = ''
    sheetData.find('cell').each((index, elem) => {
      const cell = sheet(elem)
      script += cell.text() + '\n'
    })

    const main = to
    await this.writeFile(toFs, main, script)
    return main
  }
}

module.exports = SheetScriptConverter
