import { parse, sniff, unparse } from '../src/orcid'
import { load } from '../src/vfile'

jest.setTimeout(30 * 1000)

test('sniff', async () => {
  expect(await sniff('0000-0002-1825-0097')).toBe(true)
  expect(await sniff('ORCID 0000-0002-1825-0097')).toBe(true)
  expect(await sniff('orcid: 0000-0002-1825-0097')).toBe(true)
  expect(await sniff(' ORCID :  0000-0002-1825-0097  ')).toBe(true)
  expect(await sniff('https://orcid.org/0000-0002-1825-0097')).toBe(true)
  expect(await sniff('http://orcid.org/0000-0002-1825-0097')).toBe(true)
  expect(await sniff(' https://orcid.org/0000-0002-1825-0097  ')).toBe(true)

  expect(await sniff('foo')).toBe(false)
  expect(await sniff('https://example.org/0000-0002-1825-0097')).toBe(false)
})

const josiah = {
  content: `0000-0002-1825-0097`,
  node: {
    type: 'Person',
    givenNames: ['Josiah'],
    familyNames: ['Carberry'],
    affiliations: [
      {
        type: 'Organization',
        alternateNames: ['Psychoceramics'],
        name: 'Wesleyan University'
      },
      {
        type: 'Organization',
        alternateNames: ['Psychoceramics'],
        name: 'Brown University'
      }
    ],
    alternateNames: [
      'Josiah Stinkney Carberry',
      'J. Carberry',
      'J. S. Carberry'
    ],
    url: 'http://library.brown.edu/about/hay/carberry.php'
  }
}

const stephen = {
  content: `https://orcid.org/0000-0002-9079-593X`,
  node: {
    type: 'Person',
    givenNames: ['Stephen'],
    familyNames: ['Hawking'],
    affiliations: [
      {
        type: 'Organization',
        alternateNames: ['Applied Mathematics and Theoretical Physics'],
        name: 'University of Cambridge'
      },
      {
        type: 'Organization',
        alternateNames: ['Mathematics'],
        name: 'University of Cambridge'
      },
      {
        type: 'Organization',
        alternateNames: ['Physics, Mathematics and Astronomy'],
        name: 'California Institute of Technology'
      }
    ]
  }
}

test('parse', async () => {
  expect(await parse(load(josiah.content))).toEqual(josiah.node)
  expect(await parse(load(stephen.content))).toEqual(stephen.node)
})

test('unparse', async () => {
  await expect(unparse(josiah.node)).rejects.toThrow(
    /Unparsing to an ORCID is not yet implemented/
  )
})
