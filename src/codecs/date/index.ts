/**
 * @module date
 */

import * as stencila from '@stencila/schema'
import * as vfile from '../../util/vfile'
import { Codec } from '../types'
import { getLogger } from '@stencila/logga'

const log = getLogger('encoda:date')

export class DateCodec extends Codec implements Codec {
  public readonly decode = async (
    file: vfile.VFile
  ): Promise<stencila.Node> => {
    const content = await vfile.dump(file)

    // If the content is already valid ISO 8601 then just return it
    // as the value of the date. This avoids having to parse the date
    // and then generating a concise ISO 8601 string e.g. for 2020-09
    // This regex balances permissiveness with
    // complexity. More complex, less permissive regexes for this exist
    // (see https://github.com/hapi-server/data-specification/issues/54)
    // but are probably unnecessary for this use case.
    if (
      /^(-?(?:[1-9][0-9]*)?[0-9]{4})(-(1[0-2]|0[1-9]))?(-(3[01]|0[1-9]|[12][0-9]))?(T(2[0-3]|[01][0-9]))?(:[0-5][0-9])?(:[0-5][0-9])?(\.[0-9]+)?Z?$/.test(
        content
      )
    ) {
      return stencila.date({ value: content })
    }

    // Date needs parsing
    // Add UTC to force parsing as UTC, rather than local.
    let date = new Date(content + ' UTC')
    // But if that fails, because another timezone specified then
    // just parse the raw date.
    if (isNaN(date.getTime())) date = new Date(content)
    if (isNaN(date.getTime())) {
      log.warn(`Unable to decode content to date: "${content}"`)
      return stencila.date({ value: '' })
    }

    // After parsing the date shorten it a much as possible
    // Assumes that it the user wanted to specify a date/time as precisely
    // being midnight UTC that they would enter it as an ISO string in the
    // first place
    let value = date.toISOString()
    if (value.endsWith('T00:00:00.000Z')) value = value.substring(0, 10)

    return stencila.date({ value })
  }

  public readonly encode = (node: stencila.Node): Promise<vfile.VFile> => {
    const iso = stencila.isA('Date', node) ? node.value : ''
    return Promise.resolve(vfile.load(iso))
  }
}
