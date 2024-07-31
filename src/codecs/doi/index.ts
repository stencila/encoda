/**
 * [[include:src/codecs/doi/README.md]]
 *
 * @module codecs/doi
 */

import schema from '@stencila/schema'
import * as vfile from '../../util/vfile'
import { decodeCrossrefCsl } from '../crossref'
import { Codec } from '../types'
import { encoda } from '../..'

/**
 * Codec for Digital Object Identifiers (DOI)
 *
 * A previous version of this codec used the `@doi/id` format of
 * the `CSLCodec` which is in turn based on `citation-js` and
 * fetches metadata for a DOI from https://data.crossref.org.
 * However, to use caching and retries it was switched to
 * using our own HTTP module and fetching data from
 * Crossref directly (with `decodeCsl` used for response data translation).
 */
export class DoiCodec extends Codec implements Codec {
  public readonly mediaTypes = ['text/x-doi']

  public readonly extNames = ['doi']

  // See https://www.crossref.org/blog/dois-and-matching-regular-expressions/
  // for notes on DOI matching
  private static regex =
    /^\s*((DOI\s*:?\s*)|(https?:\/\/doi\.org\/))?(10.\d{4,9}\/[^\s]+)\s*$/i

  public readonly sniff = (content: string): Promise<boolean> => {
    return Promise.resolve(DoiCodec.regex.exec(content) !== null)
  }

  public readonly decode = async (file: vfile.VFile): Promise<schema.Node> => {
    const content = await vfile.dump(file)
    const match = DoiCodec.regex.exec(content)
    if (match === null) throw new Error('Unable to parse content as a DOI')
    const doi = match[4]

    const [json] = await encoda.read(`https://api.crossref.org/works/${doi}`)
    const csl = JSON.parse(json).message as CSL.Data & { [key: string]: any }

    return csl !== undefined ? decodeCrossrefCsl(csl) : null
  }

  public readonly encode = (): Promise<vfile.VFile> => {
    throw new Error(`Encoding to DOI is not yet implemented`)
  }
}
