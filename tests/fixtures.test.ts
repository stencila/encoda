import fs from 'fs'
import path from 'path'

import glob from 'glob'

import { handled, convert } from '../src/'

test('fixtures', async () => {
  // For each node type...
  for (let typeDir of glob.sync(path.join(__dirname, 'fixtures', '*'))) {
    // For each test case...
    for (let caseDir of glob.sync(path.join(typeDir, '*'))) {
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
      // Get the list of target paths in the dir (i.e do not have -alt in the name)
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
        if (!(await handled(source))) {
          console.log(`Source file not handled: "${source}"`)
          continue
        }

        for (let extension of targetExtensions) {
          let dest = filePath + '.to' + extension
          let expected = filePath.split('.')[0] + extension

          if (!(await handled(expected))) {
            console.log(`Expected file not handled: "${expected}"`)
            continue
          }

          await convert(source, dest)

          if (['.ods', '.xlsx'].includes(extension)) {
            console.log(
              `File comparison not supported for binary format "${extension}"`
            )
            continue
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
        }
      }
    }
  }
})
