import fs from 'fs'
import glob from 'glob'
import path from 'path'
import { convert, handled } from '../src/'

const SKIP_COMPARE_EXTNAMES = ['.ods', '.xlsx']

const fixturesDir = path.join(__dirname, 'fixtures')
describe('fixtures', () => {
  // For each node type...
  for (let typeDir of glob.sync(path.join(fixturesDir, '*'))) {
    // For each test case...
    for (let caseDir of glob.sync(path.join(typeDir, '*'))) {
      if (caseDir.includes('-skip')) {
        console.log(`Skipping test case: "${caseDir}"`)
        continue
      }

      // Get a list of all files in the dir that were not generated or are named to be ignored
      const filePaths = glob
        .sync(path.join(caseDir, '*.*'))
        .filter(
          filePath =>
            !(
              path.basename(filePath).includes('.to') ||
              path.basename(filePath).includes('.skip')
            )
        )
      // Get the list of target paths in the dir (i.e do not have `.alt` in the name)
      const targetPaths = filePaths.filter(
        filePath => !path.basename(filePath).includes('.alt')
      )
      // Get a list of unique target extensions
      const targetExtensions = [
        ...new Set(targetPaths.map(filePath => path.extname(filePath)))
      ]
      // Convert from each file to each of the target extensions and compare to the target file
      for (let filePath of filePaths) {
        let source = filePath
        for (let extension of targetExtensions) {
          let dest = filePath + '.to' + extension
          let expected = filePath.split('.')[0] + extension

          const sourceName = path.relative(fixturesDir, source)
          const expectedName = path.relative(fixturesDir, expected)
          const testName = sourceName + ' → ' + expectedName
          test(testName, async () => {
            if (!(await handled(source))) {
              console.log(`Source file not handled: "${sourceName}"`)
              return
            }
            if (!(await handled(expected))) {
              console.log(`Expected file not handled: "${expectedName}"`)
              return
            }
            await convert(source, dest)

            if (SKIP_COMPARE_EXTNAMES.includes(extension)) {
              console.log(`File comparison not supported for "${extension}"`)
              return
            }

            let expectedString = fs
              .readFileSync(expected)
              .toString()
              .trim()
            let actualString = fs
              .readFileSync(dest)
              .toString()
              .trim()
            const message = `${path.basename(dest)} !== ${path.basename(
              expected
            )}`
            if (expectedString.length < 500 && actualString.length < 500) {
              // @ts-ignore
              expect(actualString, message).toEqual(expectedString)
            } else {
              // @ts-ignore
              expect(actualString === expectedString, message).toBeTruthy()
            }
          })
        }
      }
    }
  }
})
