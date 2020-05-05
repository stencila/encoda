/**
 * A script to convert Jupyter Notebook's JSON Schema into Typescript definitions.
 *
 * The `nbformat-vX.schema.json` files were obtained from:
 *    - https://github.com/jupyter/nbformat/blob/master/nbformat/v3/nbformat.v3.schema.json
 *    - https://github.com/jupyter/nbformat/blob/master/nbformat/v4/nbformat.v4.schema.json
 *
 * To regenerate files run the following in this directory:
 *
 * ```bash
 * node nbformat.js
 * ```
 */

/* eslint-disable */

const fs = require('fs-extra')
const { compile } = require('json-schema-to-typescript')

;(async () => {
  for (const version of ['v3', 'v4']) {
    const source = `nbformat-${version}.schema.json`
    const schema = await fs.readJSON(source)
    let ts = await compile(schema, 'Notebook', {
      bannerComment: `/* Generated from ${source}. Do not edit. See nbformat.js. */\n/* eslint-disable @typescript-eslint/no-explicit-any */\n`,
      style: { semi: false, singleQuote: true },
    })
    if (version === 'v3') {
      /**
       * Correct the `patternProperty` type in `Pyout` and `DisplayData` which needs to
       * allow for other properties e.g. `prompt_number`, `text`, `latex` etc
       * properties being optional i.e. `undefined`, or of other types e.g. `number`
       */
      ts = ts.replace(
        / {2}\[k: string\]: string \| string\[\]/g,
        '  [k: string]: any'
      )
    }
    await fs.writeFile(`nbformat-${version}.d.ts`, ts)
  }
})()
