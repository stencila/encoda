/**
 * Compiler for a Digital Object Identifier (DOI) URL i.e. `http[s]://doi.org/<DOI>`
 */

import * as http from '../../util/http'
import * as vfile from '../../util/vfile'
import { decodeCsl } from '../csl'
import { Codec } from '../types'

export class Crossref extends Codec implements Codec {
  public mediaTypes = ['text/x-crossref-query']

  public extNames = ['crossref-query']

  /**
   * Search Crossref for a work whose bibliographic data matches the supplied data.
   *
   * See https://www.crossref.org/labs/resolving-citations-we-dont-need-no-stinkin-parser/
   */
  public decode = async (file: vfile.VFile) => {
    const content = await vfile.dump(file)
    const response = await http.get('https://api.crossref.org/works', {
      query: {
        'query.bibliographic': content
      }
    })
    if (response.statusCode === 200 && response.body) {
      const data = JSON.parse(response.body)
      const csl = data.message.items[0]
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

      return decodeCsl(csl)
    }
    throw new Error(`Request failed`)
  }

  public encode = async (): Promise<vfile.VFile> => {
    throw new Error(`Encoding to a Crossref query is not supported`)
  }
}
