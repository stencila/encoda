/**
 * Compiler for a Digital Object Identifier (DOI) URL i.e. `http[s]://doi.org/<DOI>`
 */

import stencila from '@stencila/schema'
import axios from 'axios'
import { parseCsl } from './csl'
import { dump, VFile } from './vfile'

export const mediaTypes = ['text/x-crossref-query']
export const extNames = ['crossref-query']

/**
 * Search Crossref for a work whose bibliographic data matches the supplied data.
 *
 * See https://www.crossref.org/labs/resolving-citations-we-dont-need-no-stinkin-parser/
 */
export async function parse(file: VFile): Promise<stencila.Node> {
  const content = dump(file)
  const response = await axios.get('https://api.crossref.org/works', {
    params: {
      'query.bibliographic': content
    },
    headers: {
      // It is necessary to set the user agent to not be `axios`
      // May be related to https://github.com/tryandbry/SmartDocsNLP/issues/1
      'user-agent': 'stencila/convert'
    }
  })
  if (
    response.status === 200 &&
    response.data &&
    response.data.status === 'ok'
  ) {
    const csl = response.data.message.items[0]
    // The output from api.crossref.org is not strictly CSL-JSON
    // See  https://github.com/CrossRef/rest-api-doc/issues/222 for more
    //
    // Props `container-title`, `title`, and `ISSN` should be a string, not an array.
    for (const prop of ['container-title', 'title', 'ISSN']) {
      if (Array.isArray(csl[prop])) csl[prop] = csl[prop][0]
    }
    // Replace erroneous types
    const replacers: { [key: string]: string } = {
      'journal-article': 'article-journal',
      'book-chapter': 'chapter',
      'posted-content': 'manuscript',
      'proceedings-article': 'paper-conference'
    }
    csl.type = replacers[csl.type] || csl.type

    return parseCsl(csl)
  }
  throw new Error(`Request failed`)
}

export async function unparse(node: stencila.Node): Promise<VFile> {
  throw new Error(`Unparsing to a Crossref query is not supported`)
}
