# JSON5 codec

[JSON5](https://json5.org/) is "JSON for Humans":

> The JSON5 Data Interchange Format (JSON5) is a superset of JSON that aims
> to alleviate some of the limitations of JSON by expanding its syntax to
> include some productions from ECMAScript 5.1.

This codec is primarily targeted at developers.
Given that it is more forgiving and it has less typing overhead,
JSON5 can be a little more convenient than JSON for quickly testing
encoding of Stencila nodes e.g

```bash
stencila convert "{type:'ImageObject', contentUrl: 'https://example.org', text: 'alt', title: 'title'}" --from json5 --to html
```

Versus using JSON:

```bash
stencila convert '{"type":"ImageObject", "contentUrl": "https://example.org", "text": "alt", "title": "title"}' --from json --to html
```
