const BinWrapper = require('bin-wrapper')
const fs = require('fs')
const path = require('path')
const childProcess = require('child_process')

const pandoc = new BinWrapper({ global: false })
  .src('https://github.com/stencila/pandoc/releases/download/jats-8/pandoc-linux.tar.gz', 'linux', 'x64')
  .src('https://github.com/stencila/pandoc/releases/download/jats-8/pandoc-macOS.zip', 'darwin')
  .src('https://github.com/stencila/pandoc/releases/download/jats-8/pandoc-windows-i386.zip', 'win32')
  .dest(path.join(__dirname, '..', '..', 'vendor'))
  .use(process.platform === 'win32' ? 'pandoc.exe' : 'bin/pandoc')

fs.access(pandoc.path(), function (err) {
  if (err) {
    console.log('⧗ Downloading Pandoc (this could take some time).')
    pandoc.run(['--version'], function (err) {
      if (err) {
        console.log('✗ Download fail :(')
      } else {
        console.log('✓ Download success!')
      }
    })
  }
})

pandoc.spawn = function (input, args) {
  return new Promise((resolve, reject) => {
    const child = childProcess.spawn(pandoc.path(), args)
    let stdout = ''
    child.stdout.on('data', (data) => {
      stdout += data
    })
    child.stdout.on('end', () => {
      resolve(stdout)
    })
    child.stderr.on('data', (data) => {
      reject(new Error(data))
    })
    child.on('error', (err) => {
      reject(err)
    })
    child.stdin.setEncoding('utf-8')
    child.stdin.write(input)
    child.stdin.end()
  })
}

module.exports = pandoc
