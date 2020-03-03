# `txt`: Plain text codec

The `txt` codec is for decoding/encoding from/to plain text. It's main purpose is to provide a decoder for the `text/plain` media type (in particular for decoding outputs of Jupyter Notebook cells which have this media type). It may also be useful for decoding user input in plain text form fields.

## Decoding

The `txt` codec only decodes content to primitive node types i.e. `null`, `boolean`, `number` and `string`. It makes no attempt to decode more complex structure or semantics of the content.

The string `"null"` is decoded to `null`, the string `"true"` and `"false"` are decoded to `boolean` values, and strings with only digits and an optional decimal place are decoded to a `number`.

Everything else is decoded to a `string`. For example, this plain text content (with some Unicode characters),

```txt import=ex1
Yay, plain text! 👏
```

is decoded into a `string`, encoded in [JSON5](../json5) as,

```json5 export=ex1
'Yay, plain text! 👏'
```

## Encoding

All `Node` types are encoded as plain text. For non-`string` primitive nodes, e.g. `boolean`, `number`, the plain text representation comes from the `toString()` method.

No attempt is made to perform lossless encoding of more complex nodes. For `Array` nodes, items are encoded and joined by a single space. For `Object` nodes, if there is a `content` node then that is encoded only, otherwise values are encoded as space separated strings. For example, the following `Article` node, encoded as [JSON5](../json5),

```json5 import=ex2
{
  type: 'Article',
  title: 'My simple article',
  authors: [
    {
      type: 'Person',
      givenNames: ['Peter'],
      familyNames: ['Pan']
    }
  ],
  content: [
    {
      type: 'Paragraph',
      content: ['My first paragraph.']
    }
  ]
}
```

is encoded in `txt` as,

```txt export=ex2
My first paragraph.
```

## Invertability

The `txt` codec is only invertible for primitive node types. It is lossy for `array`, `object` and other more complex node types because it intentionally makes no attempt to encode these as plain text. Use one of the data transfer formats e.g. `json` or `yaml` for lossless text-based encoding.
