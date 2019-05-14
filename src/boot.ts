/**
 * Module for installing Convert native modules and executables
 *
 * The [`pkg`](https://github.com/zeit/pkg) Node.js packager does not
 * package native modules.  i.e `*.node` files. There are various ways to handle this but
 * we found the easiest/safest was to simply copy the directories for the
 * packages with native modules, from the host system, into directory where the
 * binary is installed. This script does that via `convert-deps.tar.gz` which is
 * packaged in the binary snapshot as an `asset`.
 *
 * See:
 *   - https://github.com/stencila/convert/pull/47#issuecomment-489912132
 *   - https://github.com/zeit/pkg/issues/329
 *   - https://github.com/JoshuaWise/better-sqlite3/issues/173
 *   - `package.json`
 */
import fs from 'fs-extra'
import path from 'path'
import puppeteer from 'puppeteer'
import tar from 'tar'
// @ts-ignore
import pandoc from './pandoc-binary'

/**
 * Is this process being run as a `pkg` packaged binary?
 */
export const packaged =
  ((process.mainModule && process.mainModule.id.endsWith('.exe')) ||
    process.hasOwnProperty('pkg')) &&
  fs.existsSync(path.join('/', 'snapshot'))

/**
 * The home directory for this modules or process where
 * native modules and executables are placed.
 */
export const home = packaged
  ? path.dirname(process.execPath)
  : path.dirname(__dirname)

// Unzip the native dependencies to home
if (packaged && !fs.existsSync(path.join(home, 'node_modules'))) {
  tar.x({
    sync: true,
    file: path.join('/', 'snapshot', 'convert', 'convert-deps.tgz'),
    C: home
  })
}

/**
 * The following code is necessary to ensure the Chromium binary can be correctly
 * found when bundled as a binary using [`pkg`](https://github.com/zeit/pkg).
 * See: [`pkg-puppeteer`](https://github.com/rocklau/pkg-puppeteer)
 */

// Adapts the regex path to work on both Windows and *Nix platforms
const pathRegex =
  process.platform === 'win32'
    ? /^.*?\\node_modules\\puppeteer\\\.local-chromium/
    : /^.*?\/node_modules\/puppeteer\/\.local-chromium/

export const chromiumPath = packaged
  ? puppeteer
      .executablePath()
      .replace(
        pathRegex,
        path.join(
          path.dirname(process.execPath),
          'node_modules',
          'puppeteer',
          '.local-chromium'
        )
      )
  : puppeteer.executablePath()

/**
 * The path to the Pandoc binary executable
 */
export const pandocPath = path.join(home, pandoc.path())

/**
 * Equivalent to the Pandoc `--data-dir` flag.
 * Instructs Pandoc where to templates and other assets.
 */
export const pandocDataDir = path.join(home, 'src')
