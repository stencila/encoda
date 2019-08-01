# `html`

This is a codec for HyperText Markup Language (HTML).
It decodes/encodes Stencila Document Tree (SDT) nodes from/to HTML.

## Philosophy

### Don't worry about lossy decoding from HTML

The aim of this codec is not to decode any old HTML file from off the interwebs.

### Aim for lossless encoding to HTML

The aim of this codec is to be able to publish Stencila documents as
completely as possible. One way we achieve through JSON-LD metadata.

### Use custom elements where necessary

For SDT nodes that do not have a natural HTML counterpart, we use
[custom elements](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements).

### Maximize machine-readability of HTML

Use semantic tags whenever possible, and microdata `itemtype` and `itemprop` attributes to allow for semantic search, and hydration of web components from HTML.

## Dependencies

Some of the main external dependencies:

- `jsdom` for it's DOM API convenience with built in typing support .
  e.g. `doc.querySelector('p')` returns a `HTMLParagraphElement`.

- `hyperscript` for it's beautifully minimal API with built in typing support.
  e.g. `h('p')` returns a `HTMLParagraphElement`

- `collapse-whitespace` to avoid extraneous string elements in decoded content.

- `js-beautify` for pretty generated HTML.

- `json5` for more human readable representation of arbitrary values.

---

## Microdata and semantic tag usage (WIP)

### Schema nodes to add microdata to
* Article
    * `div` `itemtype='schema:Article'`
    * itemprops:
        * authors* (author?): `ol`
        * title*: `h1`? (+ `title`)
        * environment: `data`?
* Audio
    * `audio`
    * itemprops:
        * caption*: `figcaption`
        * transcript
* Brand
    * `picture`/`img` `itemtype='schema:Brand'`
    * itemprops:
        * name: maybe unnecessary, just use in alt tag?
        * logo*: `source`/`image`
        * reviews
* Code
    * `div` `itemtype='stencila:Code'`
    * itemprops:
        * language* (maybe important for setting syntax highlighting): `data`
        * value*: `code`
* CodeChunk
    * `div` `itemtype='stencila:CodeChunk'`
    * itemprops:
        * outputs: `ol` of `samp`/`output` (possibly include `figure`/`table`)
* CodeExpression
    * `div` `itemtype='stencila:CodeExpr'`
    * itemprops:
        * value:`code` (syntax highlighting from Code node's language prop)
* Collection
    * `nav` `itemtype='schema:Collection'`
    * itemprops:
        * parts: `ol` of CreativeWorks/Articles (just title, author, and URIs/relative links?)
* ContactPoint
    * `address` `itemtype='schema:contactPoint'`
    * itemprops:
        * availableLanguages: `ul` of `data`? if not `p` (maybe unnecessary for styling)
        * emails: `ol` of `a href`
        * telephone: `a href`
* CreativeWork:
    * `div` `itemtype='schema:CreativeWork'`
    * itemprops:
        * authors: `ol` of `span` Person/Organization itemtypes.
        * citations: `ol` of title/authors/`a href`
        * content: `article`/`div` with `sections`
        * dateCreated: `span time`
        * dateModified: `span time`
        * datePublished/date: `span time`
        * editors: `ol` of `span` Person itemtypes
        * funders: `ol` of `span` Person/Organization itemtypes
        * isPartOf: `data`?
        * licenses: `ol` of `a href`
        * parts/hasPart: `ol` of figure/table/object/URI (maybe unnecessary for styling)
        * publisher: `span` Person/Organization itemtype
        * text: `data`? (maybe unnecessary for styling)
        * title/headline: `h1`
        * version: `span`
* DataTable:
    * `table` or `figure table` `itemtype='stencila:Datatable'`
    * columns: probably want to convert these DatatableColumns into rows when encoding into HTML, so they're made up of `tr` and `td`/`th`. Maybe keep as `data`?
        * values: `td`
        * schema (items, uniqueItems): `data`? (maybe unnecessary for styling)
        * name: `th`?

### Schema nodes we won't be adding microdata to
* Delete: `del`
* Emphasis: `em`
* Heading: 
* ImageObject: `figure`
    * thumbnail => `img`
    * caption => `figcaption`
* Link: `a`
    * content
    * target => href
* List: `ol`, `ul` (with `input type="checkbox"` option)
* Quote
* Strong
* Subscript
* Superscript
