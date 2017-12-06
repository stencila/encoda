import DocumentConverter from './DocumentConverter'
import pandoc from '../helpers/pandoc'

export default class DocumentPandocConverter extends DocumentConverter {
  import (pathFrom, pathTo, volumeFrom, volumeTo, options = {}) {
    return this.prepareImport(...arguments).then(({ pathFrom, pathTo, volumeFrom, volumeTo }) => {
      return this.readFile(pathFrom, volumeFrom).then((content) => {
        return pandoc.spawn(content, ['-r', this.pandocFormat(), '-w', 'jats'])
      }).then(result => {
        return this.writeFile(pathTo, result, volumeTo).then(() => {
          return pathTo
        })
      })
    })
  }

  export (from, path, to, name) {
    return this.prepareExport(...arguments).then(({ pathFrom, pathTo, volumeFrom, volumeTo }) => {
      return this.readFile(pathFrom, volumeFrom).then((content) => {
        return pandoc.spawn(content, ['-r', 'jats', '-w', this.pandocFormat()])
      }).then(result => {
        return this.writeFile(pathTo, result, volumeTo).then(() => {
          return pathTo
        })
      })
    })
  }
}
