---
title: Comma separated items codec
authors: []
---

# `csi`: Comma separated items codec

The `csi` codec is for decoding/encoding from/to a comma separated list of items in plain text.

## Decoding

This codec is most often used for decoding a list of strings e.g.

```csi import=fruits
apples, pears, kiwi
```

is decoded into an array of `string`s, encoded in [JSON](../json) as,

```json export=fruits
[
  "apples",
  "pears",
  "kiwi"
]
```

The `csi` codec is used in the schemas for types such as `Article` to allow shorthand entry of properties such as `authors` and `keywords` e.g. this YAML article,

```yaml import=article
type: Article
title: On the names on people
authors: Dr Jane Carter, Carter Scott, Scott Simpson III
keywords: alliteration, given names, surnames
```

is decoded into this,

```yaml export=article
type: Article
title: On the names on people
authors:
  - givenNames:
      - Carter
      - Scott Scott Simpson
    familyNames:
      - Jane Carter
    honorificPrefix: Dr
    honorificSuffix: III
    type: Person
keywords:
  - alliteration
  - given names
  - surnames

```

## Encoding

If the node to be encoded is not an array, it is wrapped as a single item array. All items in the encoded array are then encoded as text (using `JSON.stringify()` for `object` and `array` items) and separated by a comma and space. For example, this array of mixed node types:

```json import=mixes
[1, "two", false, {"a": "eh?"}, [4, 5, 6]]
```

is encoded to comma separated items as,

```csi export=mixes
1, two, false, {"a":"eh?"}, [4,5,6]
```

Although the above example looks like JSON, the encoded text is intended for human consumption. Use one of the codecs intended for lossless machine readability e.g. `json`, or `yaml`, if that is what you need.
