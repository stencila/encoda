import { parse, sniff, unparse } from '../src/doi'
import { load } from '../src/vfile'

test('sniff', async () => {
  expect(await sniff('10.1001/this/is/a/doi')).toBe(true)
  expect(await sniff('doi 10.1001/ok')).toBe(true)
  expect(await sniff('DOI 10.1001/ok')).toBe(true)
  expect(await sniff('DOI: 10.1001/ok')).toBe(true)
  expect(await sniff('  DOI :  10.1001/ok   ')).toBe(true)
  expect(await sniff('http://doi.org/10.5334/jors.182')).toBe(true)
  expect(await sniff('  https://doi.org/10.5334/jors.182  ')).toBe(true)

  // The `foo` in these example makes them not DOIs
  expect(await sniff('foo')).toBe(false)
  expect(await sniff('doi: foo')).toBe(false)
  expect(await sniff('doi: 10.1001/this/is/a/doi foo')).toBe(false)
  expect(await sniff('http://foo.org/10.5334/jors.182')).toBe(false)
})

const article = {
  content: `10.5334/jors.182`,
  node: {
    type: 'Article',
    authors: [
      {
        type: 'Person',
        givenNames: ['Kristoffer'],
        familyNames: ['Carlsson']
      },
      {
        type: 'Person',
        givenNames: ['Fredrik'],
        familyNames: ['Ekre']
      }
    ]
  }
}

test('parse', async () => {
  expect(await parse(load(article.content))).toEqual(article.node)
})

test('unparse', async () => {
  await expect(unparse(article.node)).rejects.toThrow(
    /Unparsing to DOI is not yet implemented/
  )
})
