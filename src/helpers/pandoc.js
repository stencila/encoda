const BinWrapper = require('bin-wrapper')
const binVersionCheck = require('bin-version-check')
const fs = require('fs')
const path = require('path')
const childProcess = require('child_process')

const binary = require('./pandoc.json')

const pandoc = new BinWrapper()
  // Semver requirement for Pandoc
  .version(binary.version)
  // Sources for downloaded binaries (if necessary)
  .src(binary.linux, 'linux', 'x64')
  .src(binary.macos, 'darwin')
  .src(binary.windows, 'win32')
  .dest((function () {
    // Destination for downloaded binaries (if necessary)
    switch (process.platform) {
      case 'darwin':
        return path.join(process.env.HOME, 'Library', 'Application Support', 'Stencila')
      case 'linux':
        return path.join(process.env.HOME, '.stencila')
      case 'win32':
        return path.join(process.env.APPDATA, 'Stencila')
      default:
        return path.join(process.env.HOME, 'stencila')
    }
  }()))
  .use(process.platform === 'win32' ? 'pandoc.exe' : 'bin/pandoc')

let ready = false

pandoc.get = function () {
  return new Promise((resolve, reject) => {
    if (ready) resolve()
    else {
      // Check that an acceptable version of Pandoc is available on PATH
      binVersionCheck('pandoc', pandoc.version()).then(() => {
        // Use global Pandoc by setting `pandoc.path()` to 'pandoc'
        // console.info('ℹ Global Pandoc is OK')
        pandoc.dest('')
        pandoc.use('pandoc')
        ready = true
        resolve()
      }).catch(() => {
        // Global pandoc is not available/acceptable, check local Pandoc
        binVersionCheck(pandoc.path(), pandoc.version()).then(() => {
          // console.info('ℹ Local Pandoc is OK: ' + pandoc.path())
          ready = true
          resolve()
        }).catch(() => {
          console.info('ℹ About to download Pandoc ' + binary.version + ' to: ' + pandoc.path())
          fs.unlink(pandoc.path(), function () {
            console.log('⧗ Downloading Pandoc (this could take some time).')
            pandoc.run(['--version'], function (err) {
              if (err) {
                console.log('✗ Download fail :(')
                reject(new Error())
              } else {
                console.log('✓ Download success!')
                ready = true
                resolve()
              }
            })
          })
        })
      })
    }
  })
}

pandoc.spawn = function (input, args) {
  return pandoc.get().then(() => {
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
  })
}

module.exports = pandoc
