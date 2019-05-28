import browserSync from 'browser-sync'
import chokidar from 'chokidar'
import path from 'path'
import { write } from '.'
import process from './process'

/**
 * Serve a directory, watching for file changes,
 * generating new HTML, and automatically syncing the browser.
 *
 * This function is intended to be made available in the CLI
 * and desktop to allow users to edit files within a project
 * using other tools e.g. Microsoft Word or VSCode and see the
 * updates in the publishable HTML.
 *
 * @param dir The directory to serve
 * @param include Glob pattern for files to watch within `dir`
 * @param ignore Pattern of files not to watch
 */
export function devserve(
  dir: string,
  include: string = '**/*',
  ignore: string = '^.'
) {
  const browser = browserSync.create()
  browser.init({
    server: {
      baseDir: dir,
      serveStaticOptions: {
        extensions: ['html']
      }
    }
  })

  const glob = path.join(dir, include)
  chokidar.watch(glob, { ignored: ignore }).on('change', async filePath => {
    const { dir, name, ext } = path.parse(filePath)
    if (ext !== '.html') {
      // TODO: prettier logging of file being processed
      console.error(filePath)
      const htmlPath = path.join(dir, name + '.html')
      try {
        const doc = await process(filePath)
        await write(doc, htmlPath, 'html')
        browser.reload(htmlPath)
      } catch (error) {
        // TODO: prettier logging of errors
        console.error(error)
        browser.notify(
          `<span style="color: #f83939;">${error.message}</span>`,
          60 * 60 * 1000
        )
      }
    }
  })
}
