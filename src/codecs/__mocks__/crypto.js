const crypto = jest.genMockFromModule('crypto')

crypto.randomBytes = function (size) {
  return new Buffer(size).fill(0)
}

module.exports = crypto
