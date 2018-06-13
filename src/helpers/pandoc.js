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
async function getPandoc () {
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
let dataDir
async function copyData () {
  if (dataDir) return dataDir

  // Create a Pandoc data directory
  const data = path.join(homeDir(), 'data', 'pandoc')
  mkdirp.sync(data)

  // Copy over any templates
  const templates = glob.sync('../*Template.*')
  if (templates.length) {
    const templatesDir = path.join(data, 'templates')
    mkdirp.sync(templatesDir)
    for (let template of templates) {
      let src = path.join(__dirname, '..', template)
      let dest = path.join(templatesDir, template)
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

  dataDir = data
  return dataDir
}

pandoc.spawn = async function (input, args) {
  // Ensure Pandoc is available and any data copied
  await getPandoc()
  await copyData()

  // Always use our Pandoc data directory
  args.push(`--data-dir=${dataDir}`)

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
