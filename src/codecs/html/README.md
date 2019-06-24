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

### Generate pretty HTML

Because it's easier to debug.

## Dependencies

Some of the main external dependencies:

- `jsdom` for it's DOM API convenience with built in typing support .
  e.g. `doc.querySelector('p')` returns a `HTMLParagraphElement`.

- `hyperscript` for it's beautifully minimal API with built in typing support.
  e.g. `h('p')` returns a `HTMLParagraphElement`

- `collapse-whitespace` to avoid extraneous string elements in decoded content.

- `js-beautify` for pretty generated HTML.

- `json5` for more human readable representation of arbitrary values.
