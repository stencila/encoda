/**
 * # JSON5 compiler
 *
 * [JSON5](https://json5.org/) is "JSON for Humans":
 *
 * > The JSON5 Data Interchange Format (JSON5) is a superset of JSON that aims
 * > to alleviate some of the limitations of JSON by expanding its syntax to
 * > include some productions from ECMAScript 5.1.
 *
 * This compiler is primarily targeted at developers.
 * Given that it is more forgiving and it has less typing overhead,
 * JSON5 can be a little more convenient than JSON for quickly testing
 * unparsing of Stencila nodes e.g
 *
 * ```bash
 * stencila convert "{type:'ImageObject', contentUrl: 'https://example.org', text: 'alt', title: 'title'}" --from json5 --to html
 * ```
 *
 * Versus using JSON:
 *
 * ```bash
 * stencila convert '{"type":"ImageObject", "contentUrl": "https://example.org", "text": "alt", "title": "title"}' --from json --to html
 * ```
 *
 * @module json5
 */

/** A comment required for above to be included in docs.
 * See https://github.com/christopherthielen/typedoc-plugin-external-module-name/issues/300
 */

import stencila from '@stencila/schema'
import json5 from 'json5'
import { coerce } from './util'
import { dump, load, VFile } from './vfile'

/**
 * The media types that this compiler can parse/unparse.
 */
export const mediaTypes = ['application/json5']

// The above media type is registered in the `mime` module
// so there is no need to specify `extNames`

/**
 * Parse a `VFile` with JSON5 content to a Stencila `Node`.
 *
 * @param file The `VFile` to parse
 * @returns A promise that resolves to a Stencila `Node`
 */
export async function parse(file: VFile): Promise<stencila.Node> {
  return coerce(json5.parse(dump(file)))
}

/**
 * Unparse a Stencila `Node` to a `VFile` with JSON5 content.
 *
 * @param thing The Stencila `Node` to unparse
 * @returns A promise that resolves to a `VFile`
 */
export async function unparse(node: stencila.Node): Promise<VFile> {
  return load(json5.stringify(node, null, '  '))
}
