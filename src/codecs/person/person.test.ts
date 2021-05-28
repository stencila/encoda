import { schema } from '@stencila/jesta'
import { dump } from '../../util/vfile'
import { nockRecord } from '../../__tests__/helpers'
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
    familyNames: ['Jones'],
  },
}

const jane = {
  content: 'Jane Jennifer Jones <jane@example.com>',
  node: {
    type: 'Person',
    givenNames: ['Jane', 'Jennifer'],
    familyNames: ['Jones'],
    emails: ['jane@example.com'],
  },
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
    honorificSuffix: 'PhD',
  },
}

describe('decode', () => {
  it('handles various name parts', async () => {
    let person = schema.person()

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
    expect(await decode('')).toEqual(schema.person())
    expect(await decode('#@&%')).toEqual(schema.person())
  })
})

test('encode', async () => {
  expect(await dump(await encode(joe.node))).toEqual(joe.content)
  expect(await dump(await encode(jane.node))).toEqual(jane.content)
  expect(await dump(await encode(jill.node))).toEqual(jill.content)
})
