export default class Converter {
  import (from, to, fromFs, toFs, options) {
    /* istanbul ignore next */
    return Promise.reject(
      new Error('Not implemented')
    )
  }

  export (from, to, fromFs, toFs, options) {
    /* istanbul ignore next */
    return Promise.reject(
      new Error('Not implemented')
    )
  }

  read (fs, path, options) {
    return new Promise((resolve, reject) => {
      fs.readFile(path, options, (err, data) => {
        if (err) reject(err)
        else resolve(data)
      })
    })
  }

  write (fs, path, data) {
    return new Promise((resolve, reject) => {
      fs.writeFile(path, data, (err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }
}
