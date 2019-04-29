/**
 * Compiler for CSL JSON
 *
 * Also acts a base compiler for other bibliographic formats
 * e.g. BibTeX. Based on https://citation.js.org/
 */

import stencila, { create, mutate } from '@stencila/schema'
// @ts-ignore
import Cite from 'citation-js'
import { parse as parsePerson } from './person'
import { dump, load, VFile } from './vfile'

export const mediaTypes = ['application/vnd.citationstyles.csl+json']

export const extNames = ['csl']

/**
 * Parse CSL JSON or other bibliographic format to a `stencila.Node`
 *
 * @param file The `VFile` to parse.
 * @param format The format to parse as.
 */
export async function parse(
  file: VFile,
  format: string = '@csl/object'
): Promise<stencila.Node> {
  // Many of the TODOs below are awaiting updates to the CreativeWork, Article, etc schemas

  const content = dump(file)
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

  return parseCsl(csl)
}

/**
 * Parse CSL object to a `stencila.Node`
 *
 * @param csl The CSL object to parse.
 */
export async function parseCsl(csl: {
  [key: string]: any
}): Promise<stencila.CreativeWork | stencila.Article> {
  const cw = create('CreativeWork')

  // TODO
  // if (cite.id) cw.id = cite.id

  if (csl.author) {
    cw.authors = await Promise.all(
      csl.author.map(async (author: any) => {
        return parsePerson(load(`${author.given} ${author.family}`))
      })
    )
  } else {
    cw.authors = []
  }

  // TODO
  // if (csl.title) cw.headline = csl.title

  let within
  if (csl['container-title']) {
    within = create('CreativeWork', {
      // TODO
      // headline: csl['container-title']
    })
  }

  // TODO
  // if (within) cw.isPartOf = within

  switch (csl.type) {
    case 'article-journal':
      const article = mutate(cw, 'Article')
      if (csl.page) {
        // TODO
        // article.pageStart = csl.page
      }
      return article
    default:
      throw new Error(`Unhandled citation type "${csl.type}"`)
  }
}

/**
 * Unparse a `stencila.Node` to CSL JSON or other bibliographic format
 *
 * @param node The node to unparse.
 * @param format The format to unparse to.
 *               See https://citation.js.org/api/tutorial-output_formats.html.
 * @param options The formatting options.
 *                See https://citation.js.org/api/tutorial-output_options.html
 */
export async function unparse(
  node: stencila.Node,
  format: string = 'data',
  options: { [key: string]: string } = {}
): Promise<VFile> {
  throw new Error(`Unparsing to ${format} is not yet implemented`)

  // The following snippet provides a skeleton of
  // how this function could be implemented when it is prioritized
  const csl = {
    id: 'id',
    type: 'article-journal'
  }
  const cite = new Cite([csl])
  const content = cite.format(format, options)
  return load(content)
}
