/**
 * Codec for CSL JSON
 *
 * Also acts a base codec for other bibliographic formats
 * e.g. BibTeX. Based on https://citation.js.org/
 */

import * as stencila from '@stencila/schema'
// @ts-ignore
import Cite from 'citation-js'
import { Encode, load, EncodeOptions } from '../..'
import * as vfile from '../../util/vfile'

export const mediaTypes = ['application/vnd.citationstyles.csl+json']

export const extNames = ['csl']

/**
 * Parse CSL JSON or other bibliographic format to a `Node`
 *
 * @param file The `VFile` to parse.
 * @param format The format to parse as.
 */
export async function decode(
  file: vfile.VFile,
  format: string = '@csl/object'
): Promise<stencila.Node> {
  // Many of the TODOs below are awaiting updates to the CreativeWork,
  // Article, etc schemas

  const content: string = await vfile.dump(file)
  let csls
  try {
    csls = await Cite.inputAsync(content, { forceType: format })
  } catch (error) {
    throw new Error(
      `Error when parsing content of format ${format}: ${error.message}`
    )
  }
  // TODO: work out what to return when more than one work e.g. a bibtex file
  const csl = csls[0]

  return decodeCsl(csl)
}

/**
 * Parse CSL object to a `CreativeWork` or derived type.
 *
 * @param csl The CSL object to parse.
 */
export async function decodeCsl(csl: {
  [key: string]: any
}): Promise<stencila.CreativeWork | stencila.Article> {
  const cw = stencila.creativeWork()

  // TODO
  // if (cite.id) cw.id = cite.id

  if (csl.author) {
    cw.authors = await Promise.all(
      csl.author.map(async (author: any) => {
        const person = await load(`${author.given} ${author.family}`, 'person')
        return person as stencila.Person
      })
    )
  } else {
    cw.authors = []
  }

  if (csl.title) cw.title = csl.title

  if (csl['container-title']) {
    cw.isPartOf = stencila.creativeWork({
      title: csl['container-title']
    })
  }

  switch (csl.type) {
    case 'article-journal':
      // TODO: Change to an `Article`?
      if (csl.page) {
        // TODO
        // article.pageStart = csl.page
      }
      return cw
    default:
      throw new Error(`Unhandled citation type "${csl.type}"`)
  }
}

/**
 * Encode a `Node` to CSL JSON or other bibliographic format
 *
 * @param node The node to unparse.
 * @param format The format to unparse to.
 *               See https://citation.js.org/api/tutorial-output_formats.html.
 * @param options The formatting options.
 *                See https://citation.js.org/api/tutorial-output_options.html
 */
export const encode: Encode = (
  node: stencila.Node,
  options: EncodeOptions = {}
): Promise<vfile.VFile> => {
  throw new Error(`Encoding to CSL is not yet implemented`)

  // The following snippet provides a skeleton of
  // how this function could be implemented when it is prioritized
  /*
  const csl = {
    id: 'id',
    type: 'article-journal'
  }
  const cite = new Cite([csl])
  const content = cite.format(format, options)
  return vfile.load(content)
  */
}
