---
title: Untitled
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
      - Jane
    familyNames:
      - Carter
    honorificPrefix: Dr
    type: Person
  - givenNames:
      - Carter
    familyNames:
      - Scott
    type: Person
  - givenNames:
      - Scott
    familyNames:
      - Simpson
    honorificSuffix: III
    type: Person
keywords:
  - alliteration
  - given names
  - surnames

```

## Encoding

All `Node` types are encoded as plain text using the `toString()` method. For example, this array of mixed node types:

```json import=mixes
[1, "two", false, {"a": "eh?"}, [4, 5, 6]]
```

is encoded to comma separated items as,

```csi export=mixes
1, two, false, [object Object], 4,5,6
```
