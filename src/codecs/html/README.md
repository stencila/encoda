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
    * `article` `itemtype='schema:Article'`
    * itemprops:
        * authors* (author?): `ol`
        * title*: `h1`? (+ `title`)
        * environment: `data`?
* Brand
    * `picture`/`img` `itemtype='schema:Brand'`
    * itemprops:
        * name: maybe unnecessary, just use in alt tag?
        * logo*: `source`/`image`
        * reviews
* Code
    * `code` `itemtype='stencila:Code'`
    * itemprops:
        * language* (maybe important for setting syntax highlighting): `data`
        * value*: set as `code` textContent
* CodeChunk
    * `<pre><code>...</code></pre>` `itemtype='stencila:CodeChunk'`
    * itemprops:
        * outputs: `pre` containing `samp`/`output` (see https://html.spec.whatwg.org/multipage/grouping-content.html#the-pre-element)
            * In future, consider including `figure`/`table`
* CodeExpression
    * `code` `itemtype='stencila:CodeExpr'`
    * itemprops:
        * value: set as `code` textContent (syntax highlighting from SoftwareSourceCode node's programmingLanguage prop)
* Collection
    * `ol` `itemtype='schema:Collection'`
    * itemprops:
        * parts: `li > a href` CreativeWorks/Articles (just title, author, and URIs/relative links?)
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
* SoftwareSourceCode:
    * codeRepository: `a href`
    * codeSampleType: `data`?
    * maintainers: `ol` of `span` Person/Organization itemtypes
    * programmingLanguage: `data` or `span` (maybe unnecessary for styling)
    * runtimePlatform: `ol` of `data` or `span`
    * softwareRequirements: `ol` of `span` SoftwareSourceCode/SoftwareApplication
    * targetProducts: `ol` of `span` SoftwareApplication

### Schema nodes with direct mapping to semantic tags
* AudioObject: `audio`
    * name: `figcaption`, or `p`
    * caption, transcript => `track` (if `video`), or `data`. [Consider using `video` instead of `audio` to enable captions](https://www.iandevlin.com/blog/2015/12/html5/webvtt-and-audio/), or display separately as `div`.
* Delete: `del`
* Emphasis: `em`
* Heading: 
* ImageObject: `figure`
    * thumbnail => `img`
    * caption => `figcaption`
* Link: `a`
    * content
    * target => href
* List: `ol`, `ul` 
  * ListItem => `li` (with `li` > `input type="checkbox"` option)
* Quote
* Strong => `strong`
* Subscript => `sub`
* Superscript => `sup`
* Table => `table`. `table` > `tr`, or `table` > `thead`/`tfoot` > `tr`
    * TableRow => `tr`.
        * `kind`: header => `thead` > `tr`
        * `kind`: footer => `tfoot` > `tr`
    * TableCell => `th`, `td`
        * `colspan`, `rowspan`
        * `kind`: header => `th`
        * `kind`: data => `td`
* ThematicBreak: `hr`? (not sure if we should consider other options, such as splitting nodes by ThematicBreaks and grouping them into `section` tags instead)
* VideoObject: `video`
    * caption => `track`
    * thumbnail => poster (attribute)
    * transcript => `track`?

### Schema nodes we won't be adding microdata to
* BlockContent
* CodeBlock?
* CreativeWorkTypes
* Entity
* Environment?
* Include?
    * source
    * mediaType
    * hash
    * content
* InlineContent
* Mark
* Thing
