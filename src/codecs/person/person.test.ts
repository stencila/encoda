import { decode } from './'
import { coerce, create, validate } from '../../util/index'

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

describe('decode', () => {
  it('works', async () => {
    let person = await create('Person')

    person.familyNames = ['Jones']
    expect(decode('Jones')).toEqual(person)

    person.givenNames = ['Jane', 'Jill']
    expect(decode('Jane Jill Jones')).toEqual(person)

    person.honorificPrefix = 'Dr'
    expect(decode('Dr Jane Jill Jones')).toEqual(person)

    person.honorificSuffix = 'PhD'
    expect(decode('Dr Jane Jill Jones PhD')).toEqual(person)

    person.emails = ['jane@example.com']
    expect(decode('Dr Jane Jill Jones PhD <jane@example.com>')).toEqual(person)

    person.url = 'http://example.com/jane'
    expect(
      decode(
        'Dr Jane Jill Jones PhD <jane@example.com> (http://example.com/jane)'
      )
    ).toEqual(person)
  })

  it('throws', () => {
    expect(() => decode('')).toThrow(
      /^Unable to decode string \"\" as a person$/
    )
    expect(() => decode('#@&%')).toThrow(
      /^Unable to decode string \"#@&%\" as a person$/s
    )
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
              name: 'University of Beep, Boop'
            }
          ]
        },
        'Person'
      )
    ).toEqual({
      type: 'Person',
      givenNames: ['John', 'Tom'],
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
      givenNames: ['John', 'Tom'],
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
      familyNames: ['Doe', 'Smith']
    })
  })

  it('parses strings into people', async () => {
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

  it('throws if string can not be parsed', async () => {
    await expect(
      coerce({ authors: ['John Smith', '#@&%', 'Jones, Jane'] }, 'CreativeWork')
    ).rejects.toThrow(
      '/authors/1: parser error when decoding using "person": Unable to decode string "#@&%" as a person'
    )
  })
})
