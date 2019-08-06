import * as stencila from '@stencila/schema'
import { sniff, decodeSync, decode, encode } from './'
import { coerce } from '../../util/coerce'
import { validate } from '../../util/validate'
import { dump, load } from '../../util/vfile'

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

describe('decodeSync', () => {
  it('works', async () => {
    let person = stencila.person()

    person.familyNames = ['Jones']
    expect(decodeSync('Jones')).toEqual(person)

    person.givenNames = ['Jane', 'Jill']
    expect(decodeSync('Jane Jill Jones')).toEqual(person)

    person.honorificPrefix = 'Dr'
    expect(decodeSync('Dr Jane Jill Jones')).toEqual(person)

    person.honorificSuffix = 'PhD'
    expect(decodeSync('Dr Jane Jill Jones PhD')).toEqual(person)

    person.emails = ['jane@example.com']
    expect(decodeSync('Dr Jane Jill Jones PhD <jane@example.com>')).toEqual(person)

    person.url = 'http://example.com/jane'
    expect(
      decodeSync(
        'Dr Jane Jill Jones PhD <jane@example.com> (http://example.com/jane)'
      )
    ).toEqual(person)
  })

  it('throws', () => {
    expect(() => decodeSync('')).toThrow(
      /^Unable to decode string \"\" as a person$/
    )
    expect(() => decodeSync('#@&%')).toThrow(
      /^Unable to decode string \"#@&%\" as a person$/s
    )
  })
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

test('decode', async () => {
  expect(await decode(load(joe.content))).toEqual(joe.node)
  expect(await decode(load(jane.content))).toEqual(jane.node)
  expect(await decode(load(jill.content))).toEqual(jill.node)

  await expect(decode(load(''))).rejects.toThrow(
    /^Unable to decode string \"\" as a person$/
  )
  await expect(decode(load('#@&%'))).rejects.toThrow(
    /^Unable to decode string \"#@&%\" as a person$/
  )
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

describe.skip('coerce', () => {
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
      '/authors/1: decoding error using "person" codec: Unable to decode string "#@&%" as a person'
    )
  })
})
