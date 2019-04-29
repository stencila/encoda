import { parse, sniff, unparse } from '../src/person'
import { dump, load } from '../src/vfile'

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

test('sniff', async () => {
  expect(await sniff('Joe Jones')).toBe(true)
  expect(await sniff('J Jones')).toBe(true)
  expect(await sniff('Joe James Jones')).toBe(true)
  expect(await sniff('Joe J. Jones')).toBe(true)

  expect(await sniff('Joe')).toBe(false)
  expect(await sniff('joe Jones')).toBe(false)
  expect(await sniff('Lorem ipsum')).toBe(false)
})

test('parse', async () => {
  expect(await parse(load(joe.content))).toEqual(joe.node)
  expect(await parse(load(jane.content))).toEqual(jane.node)
  expect(await parse(load(jill.content))).toEqual(jill.node)

  await expect(parse(load(''))).rejects.toThrow(
    /^Unable to parse string \"\" as a person$/
  )
  await expect(parse(load('#@&%'))).rejects.toThrow(
    /^Unable to parse string \"#@&%\" as a person$/
  )
})

test('unparse', async () => {
  expect(dump(await unparse(joe.node))).toEqual(joe.content)
  expect(dump(await unparse(jane.node))).toEqual(jane.content)
  expect(dump(await unparse(jill.node))).toEqual(jill.content)
})
