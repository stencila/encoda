const BinWrapper = require('bin-wrapper')
const binVersionCheck = require('bin-version-check')
const childProcess = require('child_process')
const fs = require('fs')
const glob = require('glob')
const mkdirp = require('mkdirp')
const path = require('path')

const binary = require('./pandoc.json')

const pandoc = new BinWrapper()
  // Semver requirement for Pandoc
  .version(binary.version)
  // Sources for downloaded binaries (if necessary)
  .src(binary.linux, 'linux', 'x64')
  .src(binary.macos, 'darwin')
  .src(binary.windows, 'win32')
  .dest(homeDir())
  .use(process.platform === 'win32' ? 'pandoc.exe' : 'bin/pandoc')

function homeDir () {
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
}

let available = false
pandoc.get = async function () {
  if (available) return

  try {
    // Check that an acceptable version of Pandoc is available on PATH
    await binVersionCheck('pandoc', pandoc.version())
    // Use global Pandoc by setting `pandoc.path()` to 'pandoc'
    // console.info('ℹ Global Pandoc is OK')
    pandoc.dest('')
    pandoc.use('pandoc')
    available = true
  } catch (err) {
    try {
      // Global pandoc is not available/acceptable, check local Pandoc
      await binVersionCheck(pandoc.path(), pandoc.version())
      // console.info('ℹ Local Pandoc is OK: ' + pandoc.path())
      available = true
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
            available = true
            resolve()
          }
        })
      })
    }
  }
}

/**
 * Use a custom Pandoc data directory to control the templates used etc
 * Also, this is necessary as a way of bundling and then making our
 * templates available when bundling as a `pkg` executable.
 */
let initialised = false
pandoc.init = async function () {
  if (initialised) return

  // Create a Pandoc data directory
  let dataDir = path.join(homeDir(), 'data', 'pandoc')
  mkdirp.sync(dataDir)
  pandoc.dataDir = dataDir

  // Copy over any templates
  const templates = glob.sync(path.join(__dirname, '..', '*Template.*'))
  if (templates.length) {
    const templatesDir = path.join(dataDir, 'templates')
    mkdirp.sync(templatesDir)
    for (let template of templates) {
      let src = template
      let dest = path.join(templatesDir, path.basename(template))
      // When run as a `pkg` executable, `fs.copyFileSync` gives the
      // error "ENOENT: no such file or directory, copyfile" (despite
      // the file being in the snapshot). So, this deals with that and
      // falls back to writeFile/readFile.
      try {
        fs.copyFileSync(src, dest)
      } catch (error) {
        fs.writeFileSync(dest, fs.readFileSync(src))
      }
    }
  }

  initialised = true
}

pandoc.setup = async function () {
  await pandoc.get()
  await pandoc.init()
}

pandoc.spawn = async function (input, args) {
  await pandoc.setup()

  // Always use our Pandoc data directory
  args.push(`--data-dir=${pandoc.dataDir}`)

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
