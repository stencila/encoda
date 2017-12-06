import BinWrapper from 'bin-wrapper'
import fs from 'fs'
import path from 'path'

const pandoc = new BinWrapper({ global: false })
  .src('https://github.com/jgm/pandoc/releases/download/2.0.4/pandoc-2.0.4-linux.tar.gz', 'linux', 'x64')
  .src('https://github.com/jgm/pandoc/releases/download/2.0.4/pandoc-2.0.4-macOS.zip', 'darwin')
  .src('https://github.com/jgm/pandoc/releases/download/2.0.4/pandoc-2.0.4-windows.zip', 'win32')
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

export default pandoc
