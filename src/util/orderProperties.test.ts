import orderProperties from './orderProperties'

describe('orderProperties', () => {
  it('does not affect non-Entity nodes', async () => {
    await expect(orderProperties(true)).toEqual(true)
    await expect(orderProperties(42)).toEqual(42)
    await expect(orderProperties([3, 2, 1])).toEqual([3, 2, 1])
    await expect(orderProperties({ b: 1, c: 2, a: 3 })).toEqual({
      b: 1,
      c: 2,
      a: 3
    })
  })

  it('always orders type, id, ...rest (alphabetical), meta and content', async () => {
    await expect(
      Object.keys(orderProperties({
        meta: {
          foo: 'bar'
        },
        content: 'First heading',
        id: 'some-id',
        depth: 1,
        type: 'Heading'
      }) as object)
    ).toEqual(['type', 'id', 'depth', 'meta', 'content'])
  })

  it('works on nested entites', async () => {
    const result = orderProperties({
      b: {
        b: 2,
        type: 'Foo',
        a: 1
      },
      a: {
        content: [],
        id: 'id',
        type: 'Foo'
      },
      type: 'Foo'
    }) as any
    await expect(Object.keys(result)).toEqual(['type', 'a', 'b'])
    await expect(Object.keys(result.a)).toEqual(['type', 'id', 'content'])
    await expect(Object.keys(result.b)).toEqual(['type', 'a', 'b'])
  })
})
