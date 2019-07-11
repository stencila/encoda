import { BlockContent, InlineContent, Paragraph } from '@stencila/schema'
import {
  blockContentTypes,
  cast,
  coerce,
  create,
  inlineContentTypes,
  isInlineContent,
  isInlineNonPrimitive,
  isInlinePrimitive,
  isNode,
  isNodeType,
  valid,
  validate,
  wrapInBlockNode
} from '../index'
import is from '../is'
import type from '../type'
import { rejects } from 'assert'

describe('create', () => {
  it('works with different types', async () => {
    expect(await create('Thing')).toEqual({
      type: 'Thing'
    })
    expect(await create('CreativeWork')).toEqual({
      type: 'CreativeWork'
    })
  })

  it('works with initial values', async () => {
    expect(
      await create('Thing', {
        name: 'thing1',
        url: 'http://example.com/thing1'
      })
    ).toEqual({
      type: 'Thing',
      name: 'thing1',
      url: 'http://example.com/thing1'
    })
  })

  it('throws with unknown types', async () => {
    // In Typescript this error is caught at compile time, so ts-ignore it
    // @ts-ignore
    await expect(create('Foo')).rejects.toThrow(/^No schema for type "Foo".$/)
  })

  it('throws when wrong initial values', async () => {
    await expect(create('Thing', { foo: 'Foo' })).rejects.toThrow(
      'Property foo is not expected to be here'
    )
    await expect(create('Thing', { type: 'Foo' })).rejects.toThrow(
      'type should be equal to one of the allowed values: Thing'
    )
  })

  it('does not throw when wrong initial values and no validation', async () => {
    expect(await create('Thing', { foo: 'invalid' }, 'none')).toEqual({
      type: 'Thing',
      foo: 'invalid'
    })
  })

  it('will coerce initial value to conform to schema', async () => {
    expect(
      await create('Thing', { name: 42, foo: 'invalid' }, 'coerce')
    ).toEqual({
      type: 'Thing',
      name: '42'
    })
  })
})

test('type', () => {
  expect(type(null)).toBe('null')
  expect(type(true)).toBe('boolean')
  expect(type(0)).toBe('number')
  expect(type(NaN)).toBe('number')
  expect(type('0')).toBe('string')
  expect(type([])).toBe('array')
  expect(type({})).toBe('object')
  expect(type({ type: 'Thing' })).toBe('Thing')
})

test('is', () => {
  expect(is(null, 'null')).toEqual(true)
  expect(is(true, 'boolean')).toEqual(true)
  expect(is(0, 'number')).toEqual(true)
  expect(is('0', 'string')).toEqual(true)
  expect(is([], 'array')).toEqual(true)
  expect(is({}, 'object')).toEqual(true)
  expect(is({ type: 'Thing' }, 'Thing')).toEqual(true)
  expect(is({ type: 'Foo' }, 'Thing')).toEqual(false)
})

describe('cast', () => {
  it('works', async () => {
    expect(await cast({}, 'Thing')).toEqual({
      type: 'Thing'
    })
    expect(await cast({ type: 'Thing' }, 'Thing')).toEqual({
      type: 'Thing'
    })
    expect(await cast({ type: 'Thing', authors: [] }, 'CreativeWork')).toEqual({
      type: 'CreativeWork',
      authors: []
    })
    expect(
      await cast(
        {
          type: 'Thing',
          title: 'Untitled',
          authors: [{ type: 'Person', givenNames: ['Jack'] }]
        },
        'Article'
      )
    ).toEqual({
      type: 'Article',
      title: 'Untitled',
      authors: [{ type: 'Person', givenNames: ['Jack'] }]
    })
  })

  it('throws on wrong property type', async () => {
    await expect(cast({ name: 42 }, 'Thing')).rejects.toThrow(
      'name: type should be string'
    )
    await expect(cast({ url: [] }, 'Thing')).rejects.toThrow(
      'url: type should be string'
    )
  })

  it('throws on additional property', async () => {
    await expect(cast({ foo: 'Bar' }, 'Thing')).rejects.toThrow(
      'Property foo is not expected to be here'
    )
  })

  it('throws on missing property', async () => {
    await expect(cast({ type: 'Thing' }, 'Article')).rejects.toThrow(
      "should have required property 'authors'"
    )
  })
})

describe('validate', () => {
  it('throws for non-objects', async () => {
    await expect(validate(null, 'Thing')).rejects.toThrow(
      /^: type should be object$/
    )
    await expect(validate(42, 'Thing')).rejects.toThrow(
      /^: type should be object$/
    )
  })

  it('throws for missing properties', async () => {
    await expect(validate({}, 'Thing')).rejects.toThrow(
      /^ should have required property 'type'$/
    )
    await expect(validate({ type: 'Article' }, 'Article')).rejects.toThrow(
      /^ should have required property 'authors'$/
    )
  })

  it('throws on type with no schema', async () => {
    // In Typescript this error is caught at compile time, so ts-ignore it
    // @ts-ignore
    await expect(validate({}, 'Foo')).rejects.toThrow(
      /^No schema for type "Foo".$/
    )
  })
})

describe('valid', () => {
  it('works', async () => {
    expect(await valid(null, 'Thing')).toBe(false)
    expect(await valid({ type: 'Thing' }, 'Thing')).toBe(true)
  })
})

describe('coerce', () => {
  it('will add type property', async () => {
    expect(await coerce({}, 'Person')).toEqual({
      type: 'Person'
    })
    expect(
      await coerce(
        {
          type: 'Foo',
          name: 'John'
        },
        'Person'
      )
    ).toEqual({
      type: 'Person',
      name: 'John'
    })
  })

  it('will coerce types', async () => {
    expect(
      await coerce(
        {
          name: 42
        },
        'Person'
      )
    ).toEqual({
      type: 'Person',
      name: '42'
    })
    expect(
      await coerce(
        {
          name: null
        },
        'Person'
      )
    ).toEqual({
      type: 'Person',
      name: ''
    })
  })

  it('will coerce arrays to scalars', async () => {
    expect(
      await coerce(
        {
          type: 'Person',
          name: [42]
        },
        'Person'
      )
    ).toEqual({
      type: 'Person',
      name: '42'
    })
  })

  it('will coerce scalars to arrays', async () => {
    expect(
      await coerce(
        {
          type: 'Person',
          givenNames: 'Jane'
        },
        'Person'
      )
    ).toEqual({
      type: 'Person',
      givenNames: ['Jane']
    })
  })

  it('will add default values for missing properties', async () => {
    expect(await coerce({}, 'Thing')).toEqual({
      type: 'Thing'
    })
  })

  it('will remove additional properties', async () => {
    expect(
      await coerce(
        {
          favoriteColor: 'red'
        },
        'Person'
      )
    ).toEqual({
      type: 'Person'
    })
  })

  it('will correct nested nodes including adding type', async () => {
    const article = await coerce(
      {
        title: 'Untitled',
        authors: [
          {
            givenNames: 'Joe'
          },
          {
            givenNames: ['Jane', 'Jill'],
            familyNames: 'Jones'
          }
        ]
      },
      'Article'
    )

    expect(article.authors[0].type).toEqual('Person')
    expect((await cast(article.authors[0], 'Person')).givenNames).toEqual([
      'Joe'
    ])
    expect(article.authors[1].type).toEqual('Person')
    expect((await cast(article.authors[1], 'Person')).familyNames).toEqual([
      'Jones'
    ])
  })

  it('currently has a bug with arrays using anyOf', async () => {
    const article = await coerce(
      {
        title: 'Untitled',
        authors: [
          {
            givenNames: ['Joe']
          },
          {
            // Even though we explicitly state that this is an
            // `Organization`, `legalName` gets dropped because
            // Ajv sees it as an additional property for `Person`
            // This is a bug in Ajv.
            type: 'Organization',
            name: 'Example Uni',
            legalName: 'Example University Inc.'
          }
        ]
      },
      'Article'
    )

    expect(article.authors[0].type).toEqual('Person')

    expect(article.authors[1].type).toEqual('Organization')
    expect(article.authors[1].name).toEqual('Example Uni')
    // @ts-ignore
    expect(article.authors[1].legalName).toBeUndefined()
    expect(
      (await cast(article.authors[1], 'Organization')).legalName
    ).toBeUndefined()
  })

  it('throws an error if unable to coerce data, or data is otherwise invalid', async () => {
    await expect(
      coerce(
        {
          name: {}
        },
        'Person'
      )
    ).rejects.toThrow('name: type should be string')

    await expect(
      coerce(
        {
          url: 'foo'
        },
        'Person'
      )
    ).rejects.toThrow('url: format should match format "uri"')
  })

  it('throws an error if invalid type', async () => {
    // @ts-ignore
    await expect(coerce({}, 'Foo')).rejects.toThrow(
      /^No schema for type "Foo".$/
    )
  })

  it('has no side effects', async () => {
    const inp: any = {
      name: 42,
      title: 'Untitled',
      authors: [{ type: 'Person', givenNames: 'Jane' }]
    }
    const out = await coerce(inp, 'Article')

    // The original object should be unchanged
    expect(inp.type).toBeUndefined()
    expect(inp.name).toEqual(42)
    const inpPerson = inp.authors[0]
    expect(inpPerson.givenNames).toEqual('Jane')

    // The new object has the changes made
    expect(out.type).toEqual('Article')
    expect(out.name).toEqual('42')
    const outPerson = await cast(out.authors[0], 'Person')
    expect(outPerson.givenNames).toEqual(['Jane'])
  })
})

const primitives = [null, true, false, NaN, 2, 'string']

describe('Wrap In Block Node', () => {
  const blockNode: BlockContent = {
    type: 'Paragraph',
    content: []
  }

  const inlineNode: InlineContent = {
    type: 'CodeExpr',
    content: []
  }

  test('it returns a given BlockContent node', () => {
    expect(wrapInBlockNode(blockNode)).toEqual(blockNode)
  })

  test('it wraps an inlineContent in a Paragraph', () => {
    ;[...primitives, inlineNode].map(node => {
      const actual = wrapInBlockNode(node)
      expect(actual).toHaveProperty('type', 'Paragraph')
    })
  })

  test('returned element contains the inlineContent', () => {
    const actual = wrapInBlockNode(inlineNode) as Paragraph
    expect(actual.content).toContain(inlineNode)
  })
})

const typeMap = {
  someType: 'someType',
  myCustomType: 'myCustomType'
}

describe('isNodeType', () => {
  it('finds the given type', () => {
    expect(isNodeType(typeMap)(typeMap.myCustomType)).toBe(true)
  })

  it('returns false when queried type is not in the type map', () => {
    expect(isNodeType(typeMap)('otherType')).toBe(false)
  })
})

describe('isNode', () => {
  test('it returns false for undefined values', () =>
    expect(isNode(typeMap)(undefined)).toBe(false))

  test('returns false for primitive values', () => {
    primitives.map(node => expect(isNode(typeMap)(node)).toBe(false))
    expect.assertions(primitives.length)
  })

  test('it returns false for empty Arrays', () =>
    expect(isNode(typeMap)([])).toBe(false))

  test('it returns false for Arrays with content', () =>
    expect(isNode(typeMap)([{ type: 'someType' }])).toBe(false))

  test('it returns false for Objects without a "type" key', () =>
    expect(isNode(typeMap)({ content: ['someContent'] })).toBe(false))

  test('it returns false for Objects containing a "type" key not found in the typeMap', () =>
    expect(isNode(typeMap)({ type: 'someOtherType' })).toBe(false))

  test('it returns true for Objects containing a "type" key found in the typeMap', () =>
    expect(isNode(typeMap)({ type: typeMap.someType })).toBe(true))
})

describe('isInlinePrimitive', () => {
  test('returns true for primitive values', () => {
    primitives.map(node => expect(isInlinePrimitive(node)).toBe(true))
    expect.assertions(primitives.length)
  })

  test('it returns false for empty Arrays', () =>
    expect(isInlinePrimitive([])).toBe(false))

  test('it returns false for Arrays with content', () =>
    expect(isInlinePrimitive([{ type: 'someType' }])).toBe(false))

  test('it returns false for Objects', () =>
    expect(isInlinePrimitive({ type: 'someOtherType' })).toBe(false))
})

describe('isInlineNonPrimitive', () => {
  test('returns false for primitive values', () => {
    primitives.map(node => expect(isInlineNonPrimitive(node)).toBe(false))
    expect.assertions(primitives.length)
  })

  test('it returns false for empty Arrays', () =>
    expect(isInlineNonPrimitive([])).toBe(false))

  test('it returns false for Arrays with content', () =>
    expect(isInlineNonPrimitive([{ type: 'someType' }])).toBe(false))

  test('it returns false for Objects containing a "type" key not found in the typeMap', () =>
    expect(isInlineNonPrimitive({ type: 'someOtherType' })).toBe(false))

  test('it returns false for BlockContent type', () =>
    expect(isInlineNonPrimitive({ type: 'Paragraph' })).toBe(false))

  test('it returns true for Objects containing a "type" key found in the typeMap', () =>
    expect(isInlineNonPrimitive({ type: 'CodeExpr' })).toBe(true))
})

describe('isInlineContent', () => {
  test('returns true for primitive types', () => {
    primitives.map(type => expect(isInlineContent(type)).toBe(true))
  })

  // TODO: Revisit/revise Code schema (Code, CodeBlock, CodeExpression, & CodeChunk)
  test.skip('returns false for BlockContent types ', () => {
    Object.values(blockContentTypes).map(type => {
      expect(isInlineContent(type)).toBe(false)
    })

    expect.assertions(Object.values(blockContentTypes).length)
  })

  test('returns true for InlineContent types ', () => {
    Object.values(inlineContentTypes).map(type => {
      expect(isInlineContent(type)).toBe(true)
    })

    expect.assertions(Object.values(inlineContentTypes).length)
  })
})
