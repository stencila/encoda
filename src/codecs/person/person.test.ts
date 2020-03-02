import * as stencila from '@stencila/schema'
import { coerce } from '../../util/coerce'
import { validate } from '../../util/validate'
import { dump } from '../../util/vfile'
import { nockRecord, snapshot } from '../../__tests__/helpers'
import { PersonCodec } from './'

const { sniff, decode, encode } = new PersonCodec()

test('sniff', async () => {
  expect(await sniff('Joe Jones')).toBe(true)
  expect(await sniff('J Jones')).toBe(true)
  expect(await sniff('Joe James Jones')).toBe(true)
  expect(await sniff('Joe J. Jones')).toBe(true)
  expect(await sniff('Joe J. Jones <joe@example.com>')).toBe(true)
  expect(await sniff('Joe J. Jones <joe-jones@example.com>')).toBe(true)

  expect(await sniff('Joe')).toBe(false)
  expect(await sniff('joe Jones')).toBe(false)
  expect(await sniff('Lorem ipsum')).toBe(false)
})

const joe = {
  content: 'Joe Jones',
  node: {
    type: 'Person',
    givenNames: ['Joe'],
    familyNames: ['Jones']
  }
}

const jane = {
  content: 'Jane Jennifer Jones <jane@example.com>',
  node: {
    type: 'Person',
    givenNames: ['Jane', 'Jennifer'],
    familyNames: ['Jones'],
    emails: ['jane@example.com']
  }
}

const jill = {
  content: 'Dr Jill J. Jones PhD <jill@example.com> (http://example.com/jill)',
  node: {
    type: 'Person',
    givenNames: ['Jill', 'J.'],
    familyNames: ['Jones'],
    emails: ['jill@example.com'],
    url: 'http://example.com/jill',
    honorificPrefix: 'Dr',
    honorificSuffix: 'PhD'
  }
}

describe('decode', () => {
  it('handles various name parts', async () => {
    let person = stencila.person()

    person.familyNames = ['Jones']
    expect(await decode('Jones')).toEqual(person)

    person.givenNames = ['Jane', 'Jill']
    expect(await decode('Jane Jill Jones')).toEqual(person)

    person.honorificPrefix = 'Dr'
    expect(await decode('Dr Jane Jill Jones')).toEqual(person)

    person.honorificSuffix = 'PhD'
    expect(await decode('Dr Jane Jill Jones PhD')).toEqual(person)

    person.emails = ['jane@example.com']
    expect(await decode('Dr Jane Jill Jones PhD <jane@example.com>')).toEqual(
      person
    )

    person.url = 'http://example.com/jane'
    expect(
      await decode(
        'Dr Jane Jill Jones PhD <jane@example.com> (http://example.com/jane)'
      )
    ).toEqual(person)
  })

  it('decodes examples', async () => {
    expect(await decode(joe.content)).toEqual(joe.node)
    expect(await decode(jane.content)).toEqual(jane.node)
    expect(await decode(jill.content)).toEqual(jill.node)
  })

  it('decodes an orcid to a Person', async () => {
    const done = await nockRecord('nock-record-orcid.json')

    expect(
      await decode('https://orcid.org/0000-0002-1825-0097')
    ).toMatchSnapshot()

    done()
  })

  it('returns an empty person if name can not be parsed', async () => {
    expect(await decode('')).toEqual(stencila.person())
    expect(await decode('#@&%')).toEqual(stencila.person())
  })
})

test('encode', async () => {
  expect(await dump(await encode(joe.node))).toEqual(joe.content)
  expect(await dump(await encode(jane.node))).toEqual(jane.content)
  expect(await dump(await encode(jill.node))).toEqual(jill.content)
})

describe('validate', () => {
  it('throws for invalid emails', async () => {
    await expect(
      validate(
        {
          type: 'Person',
          emails: ['pete@example.com', 'pete_at_example_com']
        },
        'Person'
      )
    ).rejects.toThrow('/emails/1: format should match format "email"')
  })
})

describe('coerce', () => {
  it('coerces properties', async () => {
    expect(
      await coerce(
        {
          givenNames: 'John Tom',
          familyNames: 'Smith',
          // Unfortunately it is not possible to
          // coerce an an object to an array of objects
          // so we must always have an array here
          affiliations: [
            {
              type: 'Organization',
              name: 'University of Beep, Boop'
            }
          ]
        },
        'Person'
      )
    ).toEqual({
      type: 'Person',
      givenNames: ['John Tom'],
      familyNames: ['Smith'],
      affiliations: [
        {
          type: 'Organization',
          name: 'University of Beep, Boop'
        }
      ]
    })
  })

  it('renames and coerces property aliases', async () => {
    expect(
      await coerce(
        {
          firstNames: 'John Tom',
          lastName: 'Smith'
        },
        'Person'
      )
    ).toEqual({
      type: 'Person',
      givenNames: ['John Tom'],
      familyNames: ['Smith']
    })

    expect(
      await coerce(
        {
          givenName: 'Jane',
          surnames: 'Doe Smith'
        },
        'Person'
      )
    ).toEqual({
      type: 'Person',
      givenNames: ['Jane'],
      familyNames: ['Doe Smith']
    })
  })

  // TODO: Work out why this is no longer working
  it.skip('parses strings into people', async () => {
    expect(
      await coerce(
        {
          authors: [
            'John Smith',
            'Dr Jane Jones PhD <jane@example.com>',
            'Jones, Jack (http://example.com/jack)'
          ]
        },
        'CreativeWork'
      )
    ).toEqual({
      type: 'CreativeWork',
      authors: [
        {
          type: 'Person',
          givenNames: ['John'],
          familyNames: ['Smith']
        },
        {
          type: 'Person',
          honorificPrefix: 'Dr',
          givenNames: ['Jane'],
          familyNames: ['Jones'],
          honorificSuffix: 'PhD',
          emails: ['jane@example.com']
        },
        {
          type: 'Person',
          givenNames: ['Jack'],
          familyNames: ['Jones'],
          url: 'http://example.com/jack'
        }
      ]
    })
  })
})
