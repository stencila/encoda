import path from 'path'
import {
  decodeAbstract,
  decodeAff,
  decodeAuthors,
  decodeFigure,
  decodeMath,
  decodeMetaFront,
  decodeReference,
  DecodeState,
  decodeTableWrap,
  JatsCodec,
} from '.'
import { fixture, snapshot } from '../../__tests__/helpers'
import {
  asciimathFragment,
  texFragment,
  mathmlFragment,
  texBlock,
} from '../../__fixtures__/math/kitchen-sink'
import { YamlCodec } from '../yaml'
import { unlinkFiles } from '../../util/media/unlinkFiles'
import {
  Article,
  organization,
  contactPoint,
  person,
  postalAddress,
  Organization, PublicationVolume, PublicationIssue,
} from '@stencila/schema'
import { JsonCodec } from '../json'
import * as xml from '../../util/xml'

const jats = new JatsCodec()
const json = new JsonCodec()
const yaml = new YamlCodec()

const { sniff } = jats

jest.mock('crypto')

test('sniff', async () => {
  expect(
    await sniff(
      '<!DOCTYPE article PUBLIC "-//NLM//DTD JATS (Z39.96) Journal Archiving and Interchange DTD v1.1 20151215//EN"',
    ),
  ).toBe(true)
  expect(
    await sniff(
      '<!DOCTYPE article PUBLIC "-//NLM//DTD JATS (Z39.96) Journal Publishing DTD v1.2 20190208//EN"',
    ),
  ).toBe(true)
  expect(
    await sniff(
      '<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE article\n\tPUBLIC\n  "-//NLM//DTD JATS (Z39.96) Blah blah',
    ),
  ).toBe(true)

  expect(await sniff(fixture('elife-46793-v1/main.jats.xml'))).toBe(true)
  expect(await sniff(fixture('f1000-7-1655-v1/main.jats.xml'))).toBe(true)
  expect(await sniff(fixture('plosone-0091296/main.jats.xml'))).toBe(true)

  expect(await sniff('foo bar')).toBe(false)
  expect(await sniff(__dirname)).toBe(false)
  expect(await sniff(path.join(__dirname, 'README.md'))).toBe(false)
})

describe('encode: Math', () => {
  it('encodes TeX nodes using <tex-math>', async () => {
    expect(await jats.dump(texFragment, { isStandalone: false })).toMatchFile(
      snapshot('math-tex-fragment.jats.xml'),
    )
  })
  it('encodes AsciiMath using <mml:math>', async () => {
    expect(
      await jats.dump(asciimathFragment, { isStandalone: false }),
    ).toMatchFile(snapshot('math-asciimath-fragment.jats.xml'))
  })
  it('encodes MathML using <mml:math>', async () => {
    expect(
      await jats.dump(mathmlFragment, { isStandalone: false }),
    ).toMatchFile(snapshot('math-mathml-fragment.jats.xml'))
  })
  it('encodes MathBlocks using <display-formula>', async () => {
    expect(await jats.dump(texBlock, { isStandalone: false })).toMatchFile(
      snapshot('math-tex-block.jats.xml'),
    )
  })
})

test('decode: affiliation retains content not in <institution> or address elements', () => {
  const aff = xml.load(`
    <aff id="a3">
      <label>3</label>
      <institution>Université; de Paris, Institut Cochin</institution>
      , CNRS, INSERM, Paris,
      <country>France</country>
    </aff>
  `).elements?.[0]!

  expect(decodeAff(aff)).toEqual({
    type: 'Organization',
    name: 'Université; de Paris, Institut Cochin, CNRS, INSERM, Paris',
    address: {
      type: 'PostalAddress',
      addressCountry: 'France',
    },
  })
})

test('decode: <fig> element that is actually a table', () => {
  const fig = xml.load(`
    <fig id="tbl1" orientation="portrait" position="float">
      <label>Table 1.</label>
      <caption><p>Descriptive statistics of the adolescent lifestyle-related variables in all twins and in the subsample of twins with information on biological aging.</p></caption>
      <graphic xlink:href="22275761v1_tbl1.tif"/>
      <graphic xlink:href="22275761v1_tbl1a.tif"/>
    </fig>
`).elements?.[0]!

  expect(decodeFigure(fig, {} as DecodeState)[0]).toEqual({
    type: 'Table',
    id: 'tbl1',
    label: 'Table 1.',
    caption: [
      {
        type: 'Paragraph',
        content: [
          'Descriptive statistics of the adolescent lifestyle-related variables in all twins and in the subsample of twins with information on biological aging.',
        ],
      },
    ],
    content: [
      {
        type: 'ImageObject',
        contentUrl: '22275761v1_tbl1.tif',
        meta: {
          inline: false,
        },
      },
      {
        type: 'ImageObject',
        contentUrl: '22275761v1_tbl1a.tif',
        meta: {
          inline: false,
        },
      },
    ],
    rows: [],
  })
})

test.each([
  [
    `
      <mixed-citation publication-type="journal">
        <string-name><surname>Calabrese</surname> <given-names>C</given-names></string-name>, <string-name><surname>Panuzzo</surname> <given-names>C</given-names></string-name> <etal>et al</etal> (<year>2020</year>) <article-title>Deferasirox-Dependent Iron Chelation Enhances Mitochondrial Dysfunction and Restores p53 Signaling by Stabilization of p53 Family Members in Leukemic Cells</article-title>. <source>International journal of molecular sciences</source> <fpage>21</fpage>
      </mixed-citation>
    `,
    {
      authors: [
        {
          familyNames: ['Calabrese'],
          givenNames: ['C'],
          type: 'Person',
        },
        {
          familyNames: ['Panuzzo'],
          givenNames: ['C'],
          type: 'Person',
        },
      ],
      datePublished: {
        type: 'Date',
        value: '2020',
      },
      isPartOf: {
        name: 'International journal of molecular sciences',
        type: 'Periodical',
      },
      meta: {
        publicationType: 'journal',
        yearPublished: '2020',
      },
      pageStart: 21,
      title:
        'Deferasirox-Dependent Iron Chelation Enhances Mitochondrial Dysfunction and Restores p53 Signaling by Stabilization of p53 Family Members in Leukemic Cells',
      type: 'Article',
    },
  ],
  [
    `
      <mixed-citation publication-type="other">
        <string-name><surname>Carabetta</surname> <given-names>VJ</given-names></string-name>, <string-name><surname>Greco</surname> <given-names>TM</given-names></string-name>, <string-name><surname>Cristea</surname> <given-names>IM</given-names></string-name>, and <string-name><surname>Dubnau</surname> <given-names>D</given-names></string-name> (<year>2019</year>). <source>YfmK is a Novel Nε-lysine Acetyltransferase that Directly Acetylates the Histone-like Protein HBsu in <italic>Bacillus Subtilis</italic></source>.
      </mixed-citation>
    `,
    {
      authors: [
        {
          type: 'Person',
          familyNames: ['Carabetta'],
          givenNames: ['VJ'],
        },
        {
          type: 'Person',
          familyNames: ['Greco'],
          givenNames: ['TM'],
        },
        {
          type: 'Person',
          familyNames: ['Cristea'],
          givenNames: ['IM'],
        },
        {
          type: 'Person',
          familyNames: ['Dubnau'],
          givenNames: ['D'],
        },
      ],
      datePublished: {
        type: 'Date',
        value: '2019',
      },
      meta: {
        publicationType: 'other',
        yearPublished: '2019',
      },
      title:
        'YfmK is a Novel Nε-lysine Acetyltransferase that Directly Acetylates the Histone-like Protein HBsu in Bacillus Subtilis',
      type: 'Article',
    },
  ],
  [
    `
      <mixed-citation publication-type="book">
        <person-group person-group-type="author"><string-name><surname>Peterchev</surname> <given-names>AV</given-names></string-name>, <string-name><surname>Riehl</surname> <given-names>ME</given-names></string-name></person-group>. <chapter-title>Transcranial Magnetic Stimulators</chapter-title>. <person-group person-group-type="editor"><string-name><surname>Wassermann</surname> <given-names>EM</given-names></string-name>, <string-name><surname>Peterchev</surname> <given-names>AV</given-names></string-name>, <string-name><surname>Ziemann</surname> <given-names>U</given-names></string-name>, <string-name><surname>Lisanby</surname> <given-names>SH</given-names></string-name>, <string-name><surname>Siebner</surname> <given-names>HR</given-names></string-name>, <string-name><surname>Walsh</surname> <given-names>V</given-names></string-name></person-group>. <source>The Oxford Handbook of Transcranial Stimulation</source><publisher-name>, Oxford University Press</publisher-name> <fpage>75</fpage>–<lpage>101</lpage>. <pub-id pub-id-type="doi">10.1093/oxfordhb/9780198832256.013.3</pub-id>. <year>2022</year>
      </mixed-citation>
    `,
    {
      authors: [
        {
          familyNames: ['Peterchev'],
          givenNames: ['AV'],
          type: 'Person',
        },
        {
          familyNames: ['Riehl'],
          givenNames: ['ME'],
          type: 'Person',
        },
        {
          familyNames: ['Wassermann'],
          givenNames: ['EM'],
          type: 'Person',
          meta: {
            personGroupType: 'editor',
          },
        },
        {
          familyNames: ['Peterchev'],
          givenNames: ['AV'],
          type: 'Person',
          meta: {
            personGroupType: 'editor',
          },
        },
        {
          familyNames: ['Ziemann'],
          givenNames: ['U'],
          type: 'Person',
          meta: {
            personGroupType: 'editor',
          },
        },
        {
          familyNames: ['Lisanby'],
          givenNames: ['SH'],
          type: 'Person',
          meta: {
            personGroupType: 'editor',
          },
        },
        {
          familyNames: ['Siebner'],
          givenNames: ['HR'],
          type: 'Person',
          meta: {
            personGroupType: 'editor',
          },
        },
        {
          familyNames: ['Walsh'],
          givenNames: ['V'],
          type: 'Person',
          meta: {
            personGroupType: 'editor',
          },
        }
      ],
      datePublished: {
        type: 'Date',
        value: '2022'
      },
      meta: {
        publicationType: 'book',
        yearPublished: '2022'
      },
      pageStart: 75,
      pageEnd: 101,
      title: 'Transcranial Magnetic Stimulators',
      isPartOf: {
        name: 'The Oxford Handbook of Transcranial Stimulation',
        type: 'CreativeWork'
      },
      publisher: {
        name: ', Oxford University Press',
        type: 'Organization'
      },
      identifiers: [
        {
          type: 'PropertyValue',
          name: 'doi',
          propertyID: 'https://registry.identifiers.org/registry/doi',
          value: '10.1093/oxfordhb/9780198832256.013.3'
        }
      ],
      type: 'Article'
    },
  ],
])(
  'decode: <element-citation> or <mixed-citation> element',
  (input, expected) => {
    const citation = xml.load(input).elements?.[0]!

    expect(decodeReference(citation, null, undefined)).toEqual(expected)
  },
)

test('decode: reference datePublished is added to meta.yearPublished to preserve suffixes', () => {
  const reference = `
    <mixed-citation publication-type="journal">
      <string-name><surname>Calabrese</surname> <given-names>C</given-names></string-name>, <string-name><surname>Panuzzo</surname> <given-names>C</given-names></string-name> <etal>et al</etal> (<year>2020a</year>) <article-title>Deferasirox-Dependent Iron Chelation Enhances Mitochondrial Dysfunction and Restores p53 Signaling by Stabilization of p53 Family Members in Leukemic Cells</article-title>. <source>International journal of molecular sciences</source> <fpage>21</fpage>
    </mixed-citation>
  `
  const citation = xml.load(reference).elements?.[0]!

  const result = decodeReference(citation, null, undefined)
  expect(result.meta?.yearPublished).toEqual('2020a')
})

test('decode: reference n.d. is parsed out of date published', () => {
  const reference = `
    <mixed-citation publication-type="journal">
      <string-name><surname>Calabrese</surname> <given-names>C</given-names></string-name>, <string-name><surname>Panuzzo</surname> <given-names>C</given-names></string-name> <etal>et al</etal> (<year>n.d.</year>) <article-title>Deferasirox-Dependent Iron Chelation Enhances Mitochondrial Dysfunction and Restores p53 Signaling by Stabilization of p53 Family Members in Leukemic Cells</article-title>. <source>International journal of molecular sciences</source> <fpage>21</fpage>
    </mixed-citation>
  `
  const citation = xml.load(reference).elements?.[0]!

  const result = decodeReference(citation, null, undefined)
  expect(result.meta?.yearPublished).toEqual('n.d.')
})

test('decode: reference volume number parsed as a string', () => {
  const reference = `
    <mixed-citation publication-type="journal">
      <string-name><surname>Calabrese</surname> <given-names>C</given-names></string-name>, <string-name><surname>Panuzzo</surname> <given-names>C</given-names></string-name> <etal>et al</etal> (<year>n.d.</year>) <volume>58-59</volume><article-title>Deferasirox-Dependent Iron Chelation Enhances Mitochondrial Dysfunction and Restores p53 Signaling by Stabilization of p53 Family Members in Leukemic Cells</article-title>. <source>International journal of molecular sciences</source> <fpage>21</fpage>
    </mixed-citation>
  `
  const citation = xml.load(reference).elements?.[0]!

  const result = decodeReference(citation, null, undefined)
  expect((result.isPartOf as PublicationVolume)?.volumeNumber).toEqual('58-59')
})

test('decode: reference issue number parsed as a string', () => {
  const reference = `
    <mixed-citation publication-type="journal">
      <string-name><surname>Calabrese</surname> <given-names>C</given-names></string-name>, <string-name><surname>Panuzzo</surname> <given-names>C</given-names></string-name> <etal>et al</etal> (<year>n.d.</year>) <issue>The Issue</issue><article-title>Deferasirox-Dependent Iron Chelation Enhances Mitochondrial Dysfunction and Restores p53 Signaling by Stabilization of p53 Family Members in Leukemic Cells</article-title>. <source>International journal of molecular sciences</source> <fpage>21</fpage>
    </mixed-citation>
  `
  const citation = xml.load(reference).elements?.[0]!

  const result = decodeReference(citation, null, undefined)
  expect((result.isPartOf as PublicationIssue)?.issueNumber).toEqual('The Issue')
})

test('decode: reference comment is parsed out', () => {
  const reference = `
    <mixed-citation publication-type="journal">
      <string-name><surname>Calabrese</surname> <given-names>C</given-names></string-name>, <string-name><surname>Panuzzo</surname> <given-names>C</given-names></string-name> <etal>et al</etal> (<year>n.d.</year>)<comment>This is a comment</comment><article-title>Deferasirox-Dependent Iron Chelation Enhances Mitochondrial Dysfunction and Restores p53 Signaling by Stabilization of p53 Family Members in Leukemic Cells</article-title>. <source>International journal of molecular sciences</source>
    </mixed-citation>
  `
  const citation = xml.load(reference).elements?.[0]!

  const result = decodeReference(citation, null, undefined)
  expect(result?.comments).toEqual([{
    type: 'Comment',
    commentAspect: 'This is a comment',
  }]);
})

test('decode: <table-wrap> element that has more than one <graphic>', () => {
  const fig = xml.load(`
  <table-wrap id="tblS1" orientation="portrait" position="float">
    <label>Table S1.</label>
    <caption><p>All statistical information.</p></caption>
    <graphic xlink:href="515698v2_tblS1a.tif"/>
    <graphic xlink:href="515698v2_tblS1b.tif"/>
    <graphic xlink:href="515698v2_tblS1c.tif"/>
  </table-wrap>
`).elements?.[0]!

  expect(decodeTableWrap(fig, {} as DecodeState)[0]).toEqual({
    type: 'Figure',
    id: 'tblS1',
    label: 'Table S1.',
    caption: [
      {
        type: 'Paragraph',
        content: ['All statistical information.'],
      },
    ],
    content: [
      {
        type: 'ImageObject',
        contentUrl: '515698v2_tblS1a.tif',
        meta: {
          inline: false,
        },
      },
      {
        type: 'ImageObject',
        contentUrl: '515698v2_tblS1b.tif',
        meta: {
          inline: false,
        },
      },
      {
        type: 'ImageObject',
        contentUrl: '515698v2_tblS1c.tif',
        meta: {
          inline: false,
        },
      },
    ],
  })
})

test('decode: content of <label> in a <author-notes> is followed by a space', () => {
  const front = xml.load(`
<front>
  <author-notes>
    <fn id="n1" fn-type="present-address"><label>8</label><p>Present Institution: Parean biotechnologies, Saint-Malo, France</p></fn>
    <fn id="n2" fn-type="equal"><label>&#x2020;</label><p>These authors, listed in alphabetical order, have contributed equally</p></fn>
    <corresp id="cor1"><label>&#x002A;</label>Corresponding author: David Klatzmann, H&#x00F4;pital Piti&#x00E9;-Salp&#x00EA;tri&#x00E8;re, 83 bd de l&#x2019;H&#x00F4;pital, 75651 Paris, France. Phone: &#x002B;33 1 42 17 74 61, Email: <email>david.klatzmann@sorbonne-universite.fr</email></corresp>
  </author-notes>
<front>
`).elements?.[0]!

  expect(decodeMetaFront(front)).toEqual({
    authorNotes: [
      {
        type: 'fn',
        id: 'n1',
        label: '8',
        text: 'Present Institution: Parean biotechnologies, Saint-Malo, France',
      },
      {
        type: 'fn',
        id: 'n2',
        label: '†',
        text: 'These authors, listed in alphabetical order, have contributed equally',
      },
      {
        type: 'corresp',
        id: 'cor1',
        label: '*',
        text: 'Corresponding author: David Klatzmann, Hôpital Pitié-Salpêtrière, 83 bd de l’Hôpital, 75651 Paris, France. Phone: +33 1 42 17 74 61, Email: david.klatzmann@sorbonne-universite.fr',
      },
    ],
  })
})

test('decode: content of <corresp> is added to the author notes', () => {
  const front = xml.load(`
<front>
  <author-notes>
    <fn id="n1" fn-type="present-address"><label>8</label><p>Present Institution: Parean biotechnologies, Saint-Malo, France</p></fn>
    <fn id="n2" fn-type="equal"><label>&#x2020;</label><p>These authors, listed in alphabetical order, have contributed equally</p></fn>
    <corresp id="cor1"><label>&#x002A;</label>Corresponding author: David Klatzmann, H&#x00F4;pital Piti&#x00E9;-Salp&#x00EA;tri&#x00E8;re, 83 bd de l&#x2019;H&#x00F4;pital, 75651 Paris, France. Phone: &#x002B;33 1 42 17 74 61, Email: <email>david.klatzmann@sorbonne-universite.fr</email></corresp>
  </author-notes>
<front>
`).elements?.[0]!

  expect(decodeMetaFront(front)).toEqual({
    authorNotes: [
      {
        type: 'fn',
        id: 'n1',
        label: '8',
        text: 'Present Institution: Parean biotechnologies, Saint-Malo, France',
      },
      {
        type: 'fn',
        id: 'n2',
        label: '†',
        text: 'These authors, listed in alphabetical order, have contributed equally',
      },
      {
        type: 'corresp',
        id: 'cor1',
        label: '*',
        text: 'Corresponding author: David Klatzmann, Hôpital Pitié-Salpêtrière, 83 bd de l’Hôpital, 75651 Paris, France. Phone: +33 1 42 17 74 61, Email: david.klatzmann@sorbonne-universite.fr',
      },
    ],
  })
})

test('decode: corresp ref-type is added to author meta', () => {
  const front = xml.load(`
<front>
  <contrib-group>
    <contrib contrib-type="author">
      <name><surname>Bloggs</surname><given-names>Joe</given-names></name>
      <xref ref-type="corresp" rid="cor1">&#x002A;</xref>
    </contrib>
  </contrib-group>
  <author-notes>
    <corresp id="cor1"><label>&#x002A;</label>Corresponding author: Joe Bloggs, Email: <email>joe.bloggs@example.com</email></corresp>
  </author-notes>
<front>
`).elements?.[0]!
  const decoded = decodeAuthors(front, {
    article: front,
    ancestorElem: front,
    sectionId: '',
    sectionDepth: 0,
  })
  expect(decoded).toEqual([
    {
      type: 'Person',
      familyNames: ['Bloggs'],
      givenNames: ['Joe'],
      meta: {
        notes: [
          {
            type: 'corresp',
            rid: 'cor1',
            label: '*',
          },
        ],
      },
    },
  ])
})

test('decode: extract headings and lists in abstract', () => {
  const fig = xml.load(`
  <abstract>
    <title>Abstract</title>
    <p>Datasets collected in neuroscientific studies are of ever-growing complexity, often combining high dimensional time series data from multiple data acquisition modalities. Handling and manipulating these various data streams in an adequate programming environment is crucial to ensure reliable analysis, and to facilitate sharing of reproducible analysis pipelines. Here, we present Pynapple, a lightweight python package designed to process a broad range of time-resolved data in systems neuroscience. The core feature of this package is a small number of versatile objects that support the manipulation of any data streams and task parameters. The package includes a set of methods to read common data formats and allows users to easily write their own. The resulting code is easy to read and write, avoids low-level data processing and other error-prone steps, and is fully open source. Libraries for higher-level analyses are developed within the Pynapple framework but are contained within in a collaborative repository of specialized and continuously updated analysis routines. This provides flexibility while ensuring long-term stability of the core package. In conclusion, Pynapple provides a common framework for data analysis in neuroscience.</p>
    <sec>
      <title>Highlights</title>
      <list list-type="bullet">
        <list-item><p>An open-source framework for data analysis in systems neuroscience.</p></list-item>
        <list-item><p>Easy-to-use object-oriented programming for data manipulation.</p></list-item>
        <list-item><p>A lightweight and standalone package ensuring long-term backward compatibility.</p></list-item>
      </list>
    </sec>
  </abstract>
`).elements?.[0]!

  expect(decodeAbstract(fig, {} as DecodeState)).toEqual([
    {
      type: 'Paragraph',
      content: [
        'Datasets collected in neuroscientific studies are of ever-growing complexity, often combining high dimensional time series data from multiple data acquisition modalities. Handling and manipulating these various data streams in an adequate programming environment is crucial to ensure reliable analysis, and to facilitate sharing of reproducible analysis pipelines. Here, we present Pynapple, a lightweight python package designed to process a broad range of time-resolved data in systems neuroscience. The core feature of this package is a small number of versatile objects that support the manipulation of any data streams and task parameters. The package includes a set of methods to read common data formats and allows users to easily write their own. The resulting code is easy to read and write, avoids low-level data processing and other error-prone steps, and is fully open source. Libraries for higher-level analyses are developed within the Pynapple framework but are contained within in a collaborative repository of specialized and continuously updated analysis routines. This provides flexibility while ensuring long-term stability of the core package. In conclusion, Pynapple provides a common framework for data analysis in neuroscience.',
      ],
    },
    {
      type: 'Heading',
      content: ['Highlights'],
      depth: 1,
      id: '',
    },
    {
      type: 'List',
      order: 'Unordered',
      meta: {
        listType: 'bullet',
      },
      items: [
        {
          type: 'ListItem',
          content: [
            {
              type: 'Paragraph',
              content: [
                'An open-source framework for data analysis in systems neuroscience.',
              ],
            },
          ],
        },
        {
          type: 'ListItem',
          content: [
            {
              type: 'Paragraph',
              content: [
                'Easy-to-use object-oriented programming for data manipulation.',
              ],
            },
          ],
        },
        {
          type: 'ListItem',
          content: [
            {
              type: 'Paragraph',
              content: [
                'A lightweight and standalone package ensuring long-term backward compatibility.',
              ],
            },
          ],
        },
      ],
    },
  ])
})

test.each([
  'fig.xml',
  'statement.xml',
  'quote.xml',
  'nested-list.xml',
  'supplementary-material.xml',
  'labelled-list-items.xml',
  'spaces-around-marks.xml',
  'appendix-id-subsections.xml',
  'elife-30274-v1',
  'elife-43154-v2',
  'elife-46472-v3',
  'elife-46793-v1',
  'elife-52882-v2',
  'f1000-7-1655-v1',
  'f1000-8-978-v1',
  'f1000-8-1394-v1',
  'plosone-0091296',
  'plosone-0093988',
  'plosone-0178565',
  'ijm-00202',
])('decode + encode : %s', async (article) => {
  const input = article.endsWith('.xml') ? article : `${article}/main.jats.xml`
  const name = article.endsWith('.xml') ? article.replace('.xml', '') : article

  const node = unlinkFiles(await jats.read(fixture(input)))

  expect(await yaml.dump(node)).toMatchFile(snapshot(`${name}.yaml`))

  expect(
    await jats.dump(node, {
      isStandalone: true,
    }),
  ).toMatchFile(snapshot(`${name}.jats.xml`))
})

// Tests of MECA to JSON
test.each([
  ['06908fc3-73df-1014-bb56-a21daa237ef0', '493855.xml'],
  ['48c60452-6c66-1014-adf9-c7b61873ecd3', '498369.xml'],
  ['81445f02-6bf5-1014-892a-9f5909cc27c1', '497502.xml'],
  ['8758d58a-6c3d-1014-87a3-bbc202f7d832', '223354.xml'],
  ['c2c3813f-6c98-1014-8ba7-9ee2cd5f4386', '500925.xml'],
  ['ca7917ff-6cb0-1014-9b19-d05ef1e56b05', '468444.xml'],
  ['d6f14042-6db3-1014-b228-f9da7cb8e4cc', '22275761.xml'],
  ['e9291f49-6d06-1014-9500-e156797df82e', '501569.xml'],
  ['87253', '87253.xml'],
])('decode + encode : %s', async (meca, file) => {
  const node = unlinkFiles(await jats.read(fixture(`${meca}/content/${file}`)))
  expect(await json.dump(node)).toMatchFile(snapshot(`${meca}.json`))
})

describe('authors', () => {
  test('decode collaborators', async () => {
    const { authors } = unlinkFiles(
      await jats.read(fixture('elife-30274-v1/main.jats.xml')),
    ) as Article

    expect(authors).toEqual(
      expect.arrayContaining([
        expect.objectContaining(
          organization({
            name: 'Reproducibility Project: Cancer Biology',
            contactPoints: [
              contactPoint({
                emails: ['tim@cos.io'],
              }),
              contactPoint({
                emails: ['nicole@scienceexchange.com'],
              }),
            ],
          }),
        ),
      ]),
    )

    const { members } = authors?.[authors.length - 1] as Organization
    expect(members).toEqual(
      expect.arrayContaining([
        expect.objectContaining(
          person({
            givenNames: ['Elizabeth'],
            familyNames: ['Iorns'],
            affiliations: [
              organization({
                name: 'Science Exchange',
                address: postalAddress({
                  addressCountry: 'United States',
                  addressLocality: 'Palo Alto',
                }),
              }),
            ],
          }),
        ),
      ]),
    )
  })
})

describe('decode: MathML', () => {
  test('adds the id to the alternative graphic', () => {
    const formula = xml.load(`
     <disp-formula id="eqn6">
      <alternatives>
        <graphic xlink:href="528254v1_eqn6.gif"/>
      </alternatives>
    </disp-formula>
    `).elements?.[0]!

    expect(decodeMath(formula)).toEqual([
      {
        content: [
          {
            contentUrl: '528254v1_eqn6.gif',
            meta: { inline: false },
            type: 'ImageObject',
            id: 'eqn6',
          },
        ],
        type: 'Paragraph',
      },
    ])
  })
})
