import stencila from '@stencila/schema'
import {coerce} from './coerce'

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

  it('will rename properties using aliases', async () => {
    expect(
      await coerce(
        {
          type: 'Person',
          givenName: 'John', // An alias defined on Person
          alternateName: 'Jono' // An alias inherited from Thing
        }
      )
    ).toEqual({
      type: 'Person',
      givenNames: ['John'],
      alternateNames: ['Jono']
    })
  })

  it('will coerce arrays to scalars', async () => {
    expect(
      await coerce(
        {
          type: 'Person',
          name: [42]
        }
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
        }
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
    expect((article.authors[0] as stencila.Person).givenNames).toEqual([
      'Joe'
    ])
    expect(article.authors[1].type).toEqual('Person')
    expect((article.authors[1] as stencila.Person).familyNames).toEqual([
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
    const outPerson = out.authors[0]
    // @ts-ignore
    expect(outPerson.givenNames).toEqual(['Jane'])
  })
})
