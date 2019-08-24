---
title: Untitled
authors: []
---

# Date codec

This is a simple codec for decoding and encoding strings representing dates, including date-times. It is most often used when coercing a property that expects a `Date` e.g the `datePublished` property of an `Article`. It allows authors to use a variety of data formats instead of having to enter an ISO string.

## Encoding

In the Stencila schema, dates are represented using an [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) string in the `value` property, which may include a time component. For example, this `Date` in 1840:

```json import=waitangi
{
  "type": "Date",
  "value": "1840-02-05T12:20:56.000Z"
}
```

When encoding to a string, any time component will be preserved by the `date` codec, so the above date will be encoded as:

```date export=waitangi
1840-02-05T12:20:56.000Z
```

However, if the time component is `T00:00:00.000Z` i.e. midnight , e.g. midnight 1 January 1990:

```json import=ny1990
{
  "type": "Date",
  "value": "1990-01-01T00:00:00.000Z"
}
```

then only the date component will be encoded,

```date export=ny1990
1990-01-01
```

## Decoding

The decoding of dates is handled by Javascript's [`new Date()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) constructor. This allows for various date formats to be handled. For example, the above `Date` for midnight 1 January 1990, would be decoded from all of the following:

```date equals=ny1990
1990
```

```date equals=ny1990
1990-01-01
```

```date equals=ny1990
1990-01-01T00:00:00.000Z
```

```date equals=ny1990
1 January, 1990
```

```date equals=ny1990
Jan 1 1990
```

```date equals=ny1990
Jan 1 1990 0:00
```

All decoded dates are assumed to be for the UTC timezone. If the string can not be decoded as a date, then a warning will be logged and a `Date` with an empty string for the `value` property returned.
