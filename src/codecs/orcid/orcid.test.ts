import { setupRecorder } from 'nock-record'
import { decode, sniff, encode } from '.'
import * as vfile from '../../util/vfile'
import nock = require('nock');

const record = setupRecorder({ mode: 'record' })

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

test.skip('decode', async () => {
  const { completeRecording } = await record('orcid-decode')

  expect(await decode(vfile.load(josiah.content))).toEqual(josiah.node)
  expect(await decode(vfile.load(stephen.content))).toEqual(stephen.node)

  completeRecording()
})

test('encode', async () => {
  await expect(encode(josiah.node)).rejects.toThrow(
    /Encoding to an ORCID is not yet implemented/
  )
})
