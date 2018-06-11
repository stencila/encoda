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

pandoc.get = async function () {
  if (ready) return

  try {
    // Check that an acceptable version of Pandoc is available on PATH
    await binVersionCheck('pandoc', pandoc.version())
    // Use global Pandoc by setting `pandoc.path()` to 'pandoc'
    // console.info('ℹ Global Pandoc is OK')
    pandoc.dest('')
    pandoc.use('pandoc')
    ready = true
  } catch (err) {
    try {
      // Global pandoc is not available/acceptable, check local Pandoc
      await binVersionCheck(pandoc.path(), pandoc.version())
      // console.info('ℹ Local Pandoc is OK: ' + pandoc.path())
      ready = true
    } catch (err) {
      console.info('ℹ About to download Pandoc ' + binary.version + ' to: ' + pandoc.path())
      if (fs.existsSync(pandoc.path())) fs.unlinkSync(pandoc.path())
      console.log('⧗ Downloading Pandoc (this could take some time).')
      return new Promise((resolve, reject) => {
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
    }
  }
}

pandoc.spawn = async function (input, args) {
  await pandoc.get()
  return new Promise((resolve, reject) => {
    const child = childProcess.spawn(pandoc.path(), args)
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (data) => {
      stdout += data
    })
    child.stderr.on('data', (data) => {
      stderr += data
    })
    child.on('close', () => {
      if (stderr) reject(new Error(stderr))
      else resolve(stdout)
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
