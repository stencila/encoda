const path = require('path')

function getExt (path_) {
  let match = path.basename(path_).match(/^([^.]+)?\.(.+)$/)
  if (match) return match[2]
  else return ''
}

function replaceExt (path_, ext) {
  let match = path.basename(path_).match(/^([^.]+)?\.(.+)$/)
  if (match) return path.join(path.dirname(path_), match[1] + '.' + ext)
  else return path_ + '.' + ext
}

module.exports = {
  getExt,
  replaceExt
}
