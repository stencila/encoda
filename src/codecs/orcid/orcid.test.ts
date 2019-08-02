//import { setupRecorder } from 'nock-record'
import { decode, sniff, encode } from '.'
import * as vfile from '../../util/vfile'

//const record = setupRecorder({ mode: 'record' })
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
        name: 'Wesleyan University'
      },
      {
        type: 'Organization',
        name: 'Brown University'
      }
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
        name: 'University of Cambridge'
      },
      {
        type: 'Organization',
        name: 'University of Cambridge'
      },
      {
        type: 'Organization',
        name: 'California Institute of Technology'
      }
    ]
  }
}

test('decode', async () => {
  //const { completeRecording } = await record('orcid-decode')

  expect(await decode(vfile.load(josiah.content))).toEqual(josiah.node)
  expect(await decode(vfile.load(stephen.content))).toEqual(stephen.node)

  //completeRecording()
})

test('encode', async () => {
  await expect(encode(null)).rejects.toThrow(
    /Encoding to an ORCID is not yet implemented/
  )
})
