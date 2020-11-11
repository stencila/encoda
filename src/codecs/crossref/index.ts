/**
 * Compiler for a Digital Object Identifier (DOI) URL i.e. `http[s]://doi.org/<DOI>`
 */
import schema from '@stencila/schema'
import crypto from 'crypto'
import * as http from '../../util/http'
import * as vfile from '../../util/vfile'
import * as xml from '../../util/xml'
import { elem } from '../../util/xml'
import { decodeCsl } from '../csl'
import { Codec } from '../types'
import { getLogger } from '@stencila/logga'
import { TxtCodec } from '../txt'

const log = getLogger('encoda:crossref')

export class CrossrefCodec extends Codec implements Codec {
  public readonly mediaTypes = ['text/x-crossref-query']

  public readonly extNames = ['crossref-query']

  /**
   * "Decode" some content into a `CreativeWork` by via a bibliographic query to Crossref's API
   *
   * See https://www.crossref.org/labs/resolving-citations-we-dont-need-no-stinkin-parser/
   */
  public readonly decode = async (file: vfile.VFile): Promise<schema.Node> => {
    const content = await vfile.dump(file)
    const response = await http.get('https://api.crossref.org/works', {
      query: {
        'query.bibliographic': content
      }
    })
    if (response.statusCode === 200 && response.body.length > 0) {
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
      csl.type = replacers[csl.type] ?? csl.type

      return decodeCsl(csl)
    }
    throw new Error(`Request failed`)
  }

  /**
   * Encode a `CreativeWork` to Crossref's metadata deposit schema.
   *
   * https://www.crossref.org/education/content-registration/crossrefs-metadata-deposit-schema/crossref-xsd-schema-quick-reference/
   */
  public readonly encode = (node: schema.Node): Promise<vfile.VFile> => {
    const {
      depositorName = 'Stencila',
      depositorEmail = 'doi@stenci.la',
      registrantName = 'Stencila'
    } = {}

    const deposit = elem(
      'deposit',
      elem(
        'doi_batch',
        {
          version: '4.4.2',
          xmlns: 'http://www.crossref.org/schema/4.4.2'
        },
        elem(
          'head',
          elem('doi_batch_id', crypto.randomBytes(32).toString('hex')),
          elem('timestamp', Date.now().toString()),
          elem(
            'depositor',
            elem('depositor_name', depositorName),
            elem('email_address', depositorEmail)
          ),
          elem('registrant', registrantName)
        ),
        elem('body', encodeNode(node))
      )
    )

    return Promise.resolve(vfile.load(xml.dump(deposit, { spaces: 2 })))
  }
}

/**
 * Encodes a `Node` as a child fro the Crossref `<body>` element
 *
 * Currently only handles one type of encoding (to preprint) but
 * this may be expanded in the future.
 */
function encodeNode(node: schema.Node): xml.Element | undefined {
  if (schema.isCreativeWork(node))
    return encodeCreativeWorkAsPostedContent(node)
  log.error(`Unhandled node type ${schema.nodeType(node)}`)
}

/**
 * Encode a `CreativeWork` as a Crossref `<posted_content>` element.
 *
 * See https://www.crossref.org/education/content-registration/content-type-markup-guide/posted-content-includes-preprints/
 */
function encodeCreativeWorkAsPostedContent(
  work: schema.CreativeWork
): xml.Element {
  const {
    authors = [],
    dateAccepted,
    dateCreated,
    dateModified,
    dateReceived,
    datePublished,
    description,
    fundedBy,
    genre = [],
    licenses,
    references,
    title = 'Untitled'
  } = work

  return elem(
    'posted_content',
    {
      type: 'preprint'
    },
    // Required
    elem('doi_data', elem('doi', 'the-doi'), elem('resource', 'the-url')),
    elem('group_title'),
    elem('contributors'),
    elem('titles', elem('title', TxtCodec.stringify(title))),
    encodeDate(
      'posted_date',
      datePublished ??
        dateAccepted ??
        dateReceived ??
        dateModified ??
        dateCreated ??
        new Date()
    ),
    // Optional
    dateAccepted ? encodeDate('acceptance_date', dateAccepted) : null,
    elem('institution'),
    elem('item_number'),
    elem('jats:abstract'),
    elem('fr:program'),
    elem('ai:program'),
    elem('rel:program'),
    elem('scn_policies'),
    elem('citation_list')
  )
}

function encodeDate(
  tag: string,
  date: string | Date | schema.Date
): xml.Element {
  if (!(date instanceof Date)) {
    const iso = schema.isA('Date', date) ? date.value : date
    date = new Date(iso + ' UTC')
  }
  return elem(
    tag,
    elem('year', date.getFullYear().toString()),
    elem('month', (date.getMonth() + 1).toString()),
    elem('day', date.getDate().toString())
  )
}
