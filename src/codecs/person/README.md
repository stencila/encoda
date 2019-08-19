---
title: person
authors: []
---

# `person`: a codec for plain text representation of humans

The `person` codec is most often used for decoding a simple string of plain text representing a person e.g. in the YAML header of a R Markdown file, or the `package.json` file of a NPM Javascript package.

## Decoding

Decoding a string is done in two phases.

### ORCID detection and use

If the string contains an [ORCID](https://orcid.org), then the [`orcid`](../orcid) codec is used to fetch the metadata for that person and other data in the string is ignored. For example,

```person import=josiah
Miss Josiah Carbeeeerry (https://orcid.org/0000-0002-1825-0097)
```

is decoded to,

```json export=josiah
{
  "givenNames": [
    "Josiah"
  ],
  "familyNames": [
    "Carberry"
  ],
  "type": "Person"
}
```

The ORCID can appear anywhere in the string, optionally prefixed with `http://orcid.org/` or `ORCID`. For example, this raw ORCID,

```person import=stephen
0000-0002-9079-593X
```

is decoded to

```json export=stephen
{
  "givenNames": [
    "Stephen"
  ],
  "familyNames": [
    "Hawking"
  ],
  "type": "Person"
}
```

> ⚠️ The `orcid` codec is work in progress and when complete willl return more metadata than shown above.

### Text parsing

If no ORCID is detected, or if ORCID decoding fails (e.g. due to no network access) then the text string is parsed to extract:

-   given names (and or initials)
-   family name
-   a prefix (title) e.g. `Mr`, `Dr`, `Her Majesty`
-   a suffix e.g. `PhD`, `Esquire`, `Jnr`, `III`
-   email (inside angle brackets `<>`)
-   URL (inside parentheses `()`)

For a complete list of the prefixes and suffixes supported see the [`parse-full-name`](https://github.com/dschnelldavis/parse-full-name/blob/master/index.js#L108) library used by this codec.

All of these properties are optional and "last name first followed by comma" order is also supported. For example,

```person import=john
Doe, J. PhD
```

is decoded to,

```json export=john
{
  "givenNames": [
    "J."
  ],
  "familyNames": [
    "Doe"
  ],
  "honorificSuffix": "PhD",
  "type": "Person"
}
```

whereas this, more complete example,

```person import=jane
Judge Jane J. Jones PhD IV (http://example.org/jones/jane) <jjjj@example.org>
```

is decoded to,

```json export=jane
{
  "givenNames": [
    "Jane",
    "J."
  ],
  "familyNames": [
    "Jones"
  ],
  "honorificPrefix": "Judge",
  "honorificSuffix": "PhD, IV",
  "emails": [
    "jjjj@example.org"
  ],
  "url": "http://example.org/jones/jane",
  "type": "Person"
}
```

## Encoding

When encoding a `Person` this codec simply constructs a string that is compatible with the decoding above. That means that other properties (e.g. `affiliations`) will be lost. For example, this `Person` node,

```json import=jill
{
  "type": "Person",
  "givenNames": ["Jill", "J."],
  "familyNames": ["James"],
  "emails": ["jill@example.com"],
  "url": "http://example.com/jill",
  "honorificPrefix": "Dr",
  "honorificSuffix": "PhD",
  "affiliations": [
    {
      "type": "Organization",
      "name": "Example Corp."
    }
  ]
}
```

is encoded by the `person` codec as,

```person export=jill
Dr Jill J. James PhD <jill@example.com> (http://example.com/jill)
```
