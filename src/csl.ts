/**
 * Compiler for CSL JSON
 *
 * Also acts a base compiler for other bibliographic formats
 * e.g. BibTeX. Based on https://citation.js.org/
 */

import stencila, { create, mutate, validate } from '@stencila/schema'
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
  format: string = 'object/csl'
): Promise<stencila.Node> {
  // Many of the TODOs below are awaiting updates to the CreativeWork, Article, etc schemas
  const content = dump(file)
  let cites
  try {
    cites = await Cite.inputAsync(content, { forceType: format })
  } catch (error) {
    throw new Error(
      `Error when parsing content of format ${format}: ${error.message}`
    )
  }

  // TODO: work out what to return when more than one work e.g. a bibtex file
  const cite = cites[0]

  const cw = create('CreativeWork')

  // TODO
  // if (cite.id) cw.id = cite.id

  if (cite.author) {
    cw.authors = await Promise.all(
      cite.author.map(async (author: any) => {
        return await parsePerson(load(`${author.given} ${author.family}`))
      })
    )
  } else {
    cw.authors = []
  }

  // TODO
  // if (cite.title) cw.headline = cite.title

  let within
  if (cite['container-title']) {
    within = create('CreativeWork', {
      // TODO
      // headline: cite['container-title']
    })
  }

  // TODO
  // if (within) cw.isPartOf = within

  switch (cite.type) {
    case 'article-journal':
      const article = mutate(cw, 'Article')
      if (cite.page) {
        // TODO
        // article.pageStart = cite.page
      }
      return article
    default:
      throw new Error(`Unhandled citation type "${cite.type}"`)
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
  // TODO handle more types e.g. Book
  const article = validate(node, 'Article')

  const cite = {
    type: 'article-journal'
  }
  // TODO so much more!

  const cites = new Cite([cite])
  const content = cites.format(format, options)
  return load(content)
}
