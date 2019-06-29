/**
 * A script to convert Jupyter Notebook's JSON Schema into Typescript definitions.
 *
 * The `nbformat-vX.schema.json` files were obtained from:
 *    - https://github.com/jupyter/nbformat/blob/master/nbformat/v3/nbformat.v3.schema.json
 *    - https://github.com/jupyter/nbformat/blob/master/nbformat/v4/nbformat.v4.schema.json
 *
 * To regenerate files:
 *
 * ```bash
 * node nbformat.js
 * ```
 */

const fs = require('fs-extra')
const { compile } = require('json-schema-to-typescript')

;(async () => {
  for (const version of ['v3', 'v4']) {
    const source = `nbformat-${version}.schema.json`
    const schema = await fs.readJSON(source)
    let ts = await compile(schema, 'Notebook', {
      bannerComment: `/* Generated from ${source}. Do not edit. See nbformat.js. */\n`,
      style: { semi: false, singleQuote: true }
    })
    if (version == 'v3') {
      /**
       * Correct the `patternProperty` type in `Pyout` and `DisplayData` which needs to
       * allow for other properties e.g. `prompt_number`, `text`, `latex` etc
       * properties being optional i.e. `undefined`, or of other types e.g. `number`
       */
      ts = ts.replace(
        /  \[k: string\]: string \| string\[\]/g,
        '  [k: string]: any'
      )
    }
    await fs.writeFile(`nbformat-${version}.d.ts`, ts)
  }
})()
