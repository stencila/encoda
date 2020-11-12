/**
 * Compiler for a Digital Object Identifier (DOI) URL i.e. `http[s]://doi.org/<DOI>`
 */
import schema from '@stencila/schema'
import crypto from 'crypto'
import * as http from '../../util/http'
import * as vfile from '../../util/vfile'
import * as xml from '../../util/xml'
import { decodeCsl } from '../csl'
import { Codec } from '../types'
import { getLogger } from '@stencila/logga'
import { TxtCodec } from '../txt'
import { encodeAbstract } from '../jats'

// @ts-ignore
interface Review extends schema.CreativeWork {
  type: 'Review'
  itemReviewed: schema.Thing
  reviewAspect: string
  reviewBody: string
}

type ContributorRole = 'author' | 'reviewer'

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
        'query.bibliographic': content,
      },
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
        'proceedings-article': 'paper-conference',
      }
      csl.type = replacers[csl.type] ?? csl.type

      return decodeCsl(csl)
    }
    throw new Error(`Request failed`)
  }

  /**
   * Encode a `CreativeWork` to Crossref's metadata deposit schema.
   *
   * See https://www.crossref.org/education/content-registration/crossrefs-metadata-deposit-schema/crossref-xsd-schema-quick-reference/
   * Generated XML can be validated via https://www.crossref.org/02publishers/parser.html
   */
  public readonly encode = (node: schema.Node): Promise<vfile.VFile> => {
    const {
      doi = '10.47704/1',
      url = 'https://example.org',
      depositorName = 'Stencila',
      depositorEmail = 'doi@stenci.la',
      registrantName = 'Stencila',
    } = {}

    const version = '4.4.2'

    const doc = {
      declaration: {
        attributes: {
          version: '1.0',
          encoding: 'utf-8',
        },
      },
      elements: [
        xml.elem(
          'doi_batch',
          {
            version,
            xmlns: `http://www.crossref.org/schema/${version}`,
            'xmlns:xsi': `http://www.w3.org/2001/XMLSchema-instance`,
            'xsi:schemaLocation': `http://www.crossref.org/schema/${version} http://data.crossref.org/schemas/crossref${version}.xsd`,
            'xmlns:jats': 'http://www.ncbi.nlm.nih.gov/JATS1',
          },
          xml.elem(
            'head',
            xml.elem('doi_batch_id', crypto.randomBytes(32).toString('hex')),
            xml.elem('timestamp', Date.now().toString()),
            xml.elem(
              'depositor',
              xml.elem('depositor_name', depositorName),
              xml.elem('email_address', depositorEmail)
            ),
            xml.elem('registrant', registrantName)
          ),
          xml.elem('body', encodeNode(node, doi, url))
        ),
      ],
    }

    return Promise.resolve(vfile.load(xml.dump(doc, { spaces: 2 })))
  }
}

/**
 * Encodes a `Node` as a child of the Crossref `<body>` element
 *
 * Currently handles a limited number of node types but this list
 * may be expanded in the future.
 */
function encodeNode(
  node: schema.Node,
  doi: string,
  url: string
): xml.Element | undefined {
  // @ts-ignore TODO: Replace with schema.isA('Review', node)
  if (schema.nodeType(node) === 'Review') {
    // @ts-ignore
    return encodePeerReview(node, doi, url)
  } else if (schema.isCreativeWork(node)) {
    return encodePostedContent(node, doi, url)
  }
  log.error(`Unhandled node type ${schema.nodeType(node)}`)
}

/**
 * Most of the following functions are named by the name of the XML element
 * they produce, not by the node type they consume e.g.
 *
 * `encodePeerReview` -> `<peer_review>`
 */

/**
 * Encode a `Review` as a Crossref `<peer_review>` element.
 *
 * See https://www.crossref.org/education/content-registration/content-type-markup-guide/peer-reviews/
 */
function encodePeerReview(
  review: Review,
  doi: string,
  url: string
): xml.Element {
  const {
    authors = [],
    dateAccepted,
    dateCreated,
    dateModified,
    dateReceived,
    datePublished,
    itemReviewed,
    title,
  } = review

  if (!schema.isCreativeWork(itemReviewed))
    throw new Error(
      `Item reviewed must be a CreativeWork, got a ${schema.nodeType(
        itemReviewed
      )}`
    )

  let itemReviewedDoi
  for (const identifier of itemReviewed.identifiers ?? []) {
    if (schema.isA('PropertyValue', identifier)) {
      const { name, value } = identifier
      if (name?.toLowerCase() === 'doi') {
        itemReviewedDoi = `${value}`
      }
    }
  }
  if (itemReviewedDoi === undefined) {
    throw new Error(
      `Item reviewed must have a DOI in it's identifiers property`
    )
  }

  return xml.elem(
    'peer_review',
    encodeContributors(authors, 'reviewer'),
    encodeTitle(title),
    encodeDate(
      'review_date',
      datePublished ??
        dateAccepted ??
        dateReceived ??
        dateModified ??
        dateCreated ??
        new Date()
    ),
    encodeProgramRelatedItem(itemReviewedDoi),
    encodeDoiData(doi, url)
  )
}

/**
 * Encode a `CreativeWork` as a Crossref `<posted_content>` element.
 *
 * See https://www.crossref.org/education/content-registration/content-type-markup-guide/posted-content-includes-preprints/
 */
function encodePostedContent(
  work: schema.CreativeWork,
  doi: string,
  url: string
): xml.Element {
  const {
    authors = [],
    dateAccepted,
    dateCreated,
    dateModified,
    dateReceived,
    datePublished,
    description,
    genre = [],
    title,
  } = work

  // Create JATS abstract and namespace it and it's child tags
  const abstract = encodeAbstract(description)
  if (abstract !== null) {
    abstract.attributes = { xmlns: 'http://www.ncbi.nlm.nih.gov/JATS1' }
  }

  return xml.elem(
    'posted_content',
    { type: 'preprint' },
    xml.elem('group_title', genre?.[0] ?? schema.nodeType(work)),
    encodeContributors(authors, 'author'),
    encodeTitle(title),
    encodeDate(
      'posted_date',
      datePublished ??
        dateAccepted ??
        dateReceived ??
        dateModified ??
        dateCreated ??
        new Date()
    ),
    dateAccepted !== undefined
      ? encodeDate('acceptance_date', dateAccepted)
      : null,
    abstract,
    encodeDoiData(doi, url)
  )
}

function encodeContributors(
  authors: (schema.Person | schema.Organization)[],
  contributorRole: ContributorRole
): xml.Element {
  return xml.elem(
    'contributors',
    ...authors.map((author, index) =>
      schema.isA('Person', author)
        ? encodePersonName(
            author,
            contributorRole,
            index === 0 ? 'first' : 'additional'
          )
        : encodeOrganization(author)
    )
  )
}

function encodeTitle(title: schema.CreativeWork['title']): xml.Element {
  return xml.elem(
    'titles',
    xml.elem('title', TxtCodec.stringify(title ?? 'Untitled'))
  )
}

function encodePersonName(
  person: schema.Person,
  contributorRole: ContributorRole,
  sequence: 'first' | 'additional'
): xml.Element {
  return xml.elem(
    'person_name',
    {
      contributor_role: contributorRole,
      sequence,
    },
    xml.elem('given_name', person.givenNames?.join(' ')),
    xml.elem('surname', person.familyNames?.join(' '))
  )
}

function encodeOrganization(organization: schema.Organization): xml.Element {
  return xml.elem('organization', organization.name)
}

function encodeDate(
  tag: string,
  date: string | Date | schema.Date
): xml.Element {
  if (!(date instanceof Date)) {
    const iso = schema.isA('Date', date) ? date.value : date
    date = new Date(iso + ' UTC')
  }
  return xml.elem(
    tag,
    xml.elem('month', (date.getMonth() + 1).toString().padStart(2, '0')),
    xml.elem('day', date.getDate().toString().padStart(2, '0')),
    xml.elem('year', date.getFullYear().toString())
  )
}

function encodeProgramRelatedItem(
  doi: string,
  relation = 'isReviewOf'
): xml.Element {
  return xml.elem(
    'program',
    { xmlns: 'http://www.crossref.org/relations.xsd' },
    xml.elem(
      'related_item',
      xml.elem(
        'inter_work_relation',
        {
          'relationship-type': relation,
          'identifier-type': 'doi',
        },
        doi
      )
    )
  )
}

function encodeDoiData(doi: string, url: string): xml.Element {
  return xml.elem('doi_data', xml.elem('doi', doi), xml.elem('resource', url))
}
