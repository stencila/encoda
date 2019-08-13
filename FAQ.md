# FAQ

## Development/Technical Questions

## Why do all the codecs both `extend` and `implement` Codec? Shouldn't just extending accomplish the method checking?

One of the primary reasons for using classes was to improve the type safety of
the Codecs and ensure they all conform to the required interfaces.

Due to the nature of how the implementation of properties are enforced in TypeScript,
and the ability to check class inheritance at runtime, we use both the `extend` and `implement` keywords.

Below is an example demonstrating the shortcomings of each `keyword` when used by itself.

### Only using `extends`

```ts
class A {
  public mediaTypes: string[]
  public extNames?: string[]
  public encode: (n: Node) => Promise<VFile>
}

class B extends A {
  // 👎 no TypeScript errors reported as all fields are inherited
}

B.prototype instanceof A // true
// 👍 Class inheritance can be validated at runtime
```

```ts
abstract class A {
  public abstract mediaTypes: string[]
  public abstract extNames?: string[]
  public abstract encode: (n: Node) => Promise<VFile>
}

class B extends A {
  // 👍 TypeScript errors reported for all necessary fields
}

B.prototype instanceof A // false
// 👎 Class inheritance cannot be validated at runtime
// This is necessary to dynamically import and instantiate a codec at runtime
```

```ts
abstract class A {
  public abstract mediaTypes: string[]
  public extNames?: string[]
  // ⚠️ Optional methods/properties are not marked as `abstract`, otherwise TypeScript
  // raises a false error requiring the user to implement it

  public abstract encode: (n: Node) => Promise<VFile>
}

class B extends A {
  // 👎 no TypeScript errors reported as all fields are inherited
}

B.prototype instanceof A // true
// 👍 Class inheritance can be validated at runtime
```
