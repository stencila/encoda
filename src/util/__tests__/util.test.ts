import { BlockContent, InlineContent, Paragraph } from '@stencila/schema'
import {
  cast,
  coerce,
  create,
  valid,
  validate,
  wrapInBlockNode
} from '../index'

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

  it('will coerce initial value to conform to schema', async () => {
    expect(
      await create('Thing', { name: 42 }, 'coerce')
    ).toEqual({
      type: 'Thing',
      name: '42'
    })
  })
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

  it('will not remove additional properties', async () => {
    await expect(
      coerce(
        {
          favoriteColor: 'red'
        },
        'Person'
      )
    ).rejects.toThrow(/Property favoriteColor is not expected to be here/)
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
