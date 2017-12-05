import DocumentConverter from './DocumentConverter'
var pandoc = require('node-pandoc')

export default class DocumentPandocConverter extends DocumentConverter {
  pandocFormat () { return "jats" }
  addExtension () { return ".jats.xml" }
  import (from, path, to, name) {

    const src = from.readFileSync(path, 'utf8')
    const args = '-r ' + this.pandocFormat() + ' -w jats'

    return new Promise((resolve, reject)=> {
      const callback = (err, result)=> {
        if (err) {
          reject(err)
        }
        else {
          const main = name + '.jats.xml'
          to.writeFileSync(main, result, 'utf8')
          resolve(main)
        }
      }
      pandoc(src, args, callback)
    })
  }
  export (from, path, to, name) {

    const src = from.readFileSync(path, 'utf8')
    const args = '-r jats -w ' + this.pandocFormat()

    return new Promise((resolve, reject)=> {
      const callback = (err, result)=> {
        if (err) {
          reject(err)
        }
        else {
          const main = this.addExtension(name)
          to.writeFileSync(main, result, 'utf8')
          resolve(main)
        }
      }
      pandoc(src, args, callback)
    })
  }
}
