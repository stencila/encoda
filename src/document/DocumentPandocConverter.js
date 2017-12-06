import DocumentConverter from './DocumentConverter'
import pandoc from '../helpers/pandoc'

export default class DocumentPandocConverter extends DocumentConverter {
  pandocArgs (args, options) {
    return args.concat([
      // Line endings : --eol=crlf|lf|native
      '--eol', options.eol || 'native'
    ])
  }

  import (pathFrom, pathTo, volumeFrom, volumeTo, options = {}) {
    return this.prepareImport(...arguments).then(({ pathFrom, pathTo, volumeFrom, volumeTo }) => {
      return this.readFile(pathFrom, volumeFrom, options).then((content) => {
        const args = this.pandocArgs([
          '--from', this.pandocFormat(),
          '--to', 'jats'
        ], options)
        return pandoc.spawn(content, args)
      }).then(result => {
        return this.writeFile(pathTo, result, volumeTo, options).then(() => {
          return pathTo
        })
      })
    })
  }

  export (pathFrom, pathTo, volumeFrom, volumeTo, options = {}) {
    return this.prepareExport(...arguments).then(({ pathFrom, pathTo, volumeFrom, volumeTo }) => {
      return this.readFile(pathFrom, volumeFrom).then((content) => {
        const args = this.pandocArgs([
          '--from', 'jats',
          '--to', this.pandocFormat()
        ], options)
        return pandoc.spawn(content, args)
      }).then(result => {
        return this.writeFile(pathTo, result, volumeTo, options).then(() => {
          return pathTo
        })
      })
    })
  }
}
