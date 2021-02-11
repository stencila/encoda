# Citation Style Language

A codec for CSL JSON. Also acts a base codec for other bibliographic formats
e.g. BibTeX. Based on https://citation.js.org/

## Develop

The `styles` directory contains CSL styles downloaded from the CSL [styles Github repository](https://github.com/citation-style-language/styles). These styles are used by the `pandoc` codec when encoding to some formats e.g. `docx`.

To download the most recent versions of the styles, from the top level of this repository:

```bash
make -C src/codecs/csl/styles
```
