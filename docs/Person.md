---
authors: []
---

# `Person`

The [`Person` schema type](https://stencila.github.io/schema/Person) allows you to provide details about a person such as their given and family names, any honorific prefix or suffix, and contact details such as an email address. It is often used to describe the authors of an `Article`, or other `CreativeWork`.

The following examples, based on Marie Curie, illustrate alternative formats for specifying a `Person`. [Marie Curie](https://en.wikipedia.org/wiki/Marie_Curie) was the first woman to win a Nobel Prize, the first person and only woman to win twice, and the only person to win a Nobel Prize in two different sciences.

## JSON

Dr Curie could be represented in canonical Stencila JSON like this:

```json load=marie
{
  "type": "Person",
  "honorificPrefix": "Dr",
  "givenNames": ["Marie"],
  "familyNames": ["Skłodowska", "Curie"],
  "honorificSuffix": "PhD"
}
```

That's quite a lot of code! Don't worry, in the following sections we'll progressively show how you can make that a lot shorter.

### Property aliases

Because the `Person` schema defines aliases for most of its properties, you can use those instead. For example, you may prefer to use the US convention of `firstNames` and `lastNames` (instead of `givenNames` and `familyNames`) and the shorter `prefix` and `suffix` (instead of the longer "honorific" versions):

```json equals=marie line=3,4,5,6
{
  "type": "Person",
  "prefix": "Dr",
  "firstNames": ["Marie"],
  "lastNames": ["Skłodowska", "Curie"],
  "suffix": "PhD"
}
```

### Value coersion

When decoding content, including JSON content, Convert will coerce property values to ensure that they conform to the schema for the type. For example, since Dr Curie only has one given name, it's more
convenient to just provide a single string, rather than an array of strings. Also, note that we are making use of another property alias here `firstName` (singular; instead of the canonical `givenNames`).

```json equals=marie line=4
{
  "type": "Person",
  "prefix": "Dr",
  "firstName": "Marie",
  "lastNames": ["Skłodowska", "Curie"],
  "suffix": "PhD"
}
```

### Value parsing

As well a coercing ....

```json equals=marie line=6
{
  "type": "Person",
  "prefix": "Dr",
  "firstName": "Marie",
  "lastNames": "Skłodowska Curie",
  "suffix": "PhD"
}
```

## JSON5

```json5 equals=marie
{
  type: 'Person',
  prefix: 'Dr',
  firstName: 'Marie',
  lastNames: 'Skłodowska Curie',
  suffix: 'PhD'
}
```

## YAML

```yaml equals=marie
type: Person
prefix: Dr
firstName: Marie
lastNames: Skłodowska Curie
suffix: PhD
```

## Text

> The following example should have `from=person equals=marie` added to
> it when the `person` codec is enabled at the top level.

    Dr Marie Skłodowska Curie PhD
