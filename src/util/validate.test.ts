import { validate, isValid } from './validate'

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
    await expect(validate({ type: 'Heading' }, 'Heading')).rejects.toThrow(
      /^ should have required property 'content'$/
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

describe('isValid', () => {
  it('works', async () => {
    expect(await isValid(null, 'Thing')).toBe(false)
    expect(await isValid({ type: 'Thing' }, 'Thing')).toBe(true)
  })
})
