# Encoda

##### Codecs for structured, semantic, composable, and executable documents

[![Build status](https://travis-ci.org/stencila/encoda.svg?branch=master)](https://travis-ci.org/stencila/encoda)
[![Build status](https://ci.appveyor.com/api/projects/status/f1hx694pxm0fyqni/branch/master?svg=true)](https://ci.appveyor.com/project/nokome/encoda)
[![Code coverage](https://codecov.io/gh/stencila/encoda/branch/master/graph/badge.svg)](https://codecov.io/gh/stencila/encoda)
[![NPM](https://img.shields.io/npm/v/@stencila/encoda.svg?style=flat)](https://www.npmjs.com/package/@stencila/encoda)
[![Contributors](https://img.shields.io/badge/contributors-6-orange.svg)](#contribute)
[![Docs](https://img.shields.io/badge/docs-latest-blue.svg)](https://stencila.github.io/encoda/)
[![Chat](https://badges.gitter.im/stencila/stencila.svg)](https://gitter.im/stencila/stencila)

<!-- Automatically generated TOC. Don't edit, `make docs` instead>

<!-- toc -->

- [Introduction](#introduction)
- [Formats](#formats)
- [Install](#install)
- [Use](#use)
- [Documentation](#documentation)
- [Develop](#develop)
- [Contribute](#contribute)
- [Contributors](#contributors)
- [Acknowledgments](#acknowledgments)

<!-- tocstop -->

## Introduction

> "A codec is a device or computer program for encoding or decoding a digital data stream or signal. Codec is a portmanteau of coder-decoder. - [Wikipedia](https://en.wikipedia.org/wiki/Codec)

Encoda provides a collection of codecs for converting between, and composing together, documents in various formats. The aim is not to achieve perfect lossless conversion between alternative document formats; there are already several tools for that. Instead the focus of Encoda is to use existing tools to encode and compose semantic documents in alternative formats.

## Formats

| Format                      | Codec         | Approach | Status | Issues                  | Coverage             |
| --------------------------- | ------------- | -------- | ------ | ----------------------- | -------------------- |
| **Text**                    |
| Plain text                  | [txt]         | None     | β      | [⚠][txt-issues]         | ![][txt-cov]         |
| Markdown                    | [md]          | Extens   | α      | [⚠][md-issues]          | ![][md-cov]          |
| LaTex                       | [latex]       | -        | α      | [⚠][latex-issues]       | ![][latex-cov]       |
| Microsoft Word              | [docx]        | rPNG     | α      | [⚠][docx-issues]        | ![][docx-cov]        |
| Google Docs                 | [gdoc]        | rPNG     | α      | [⚠][gdoc-issues]        | ![][gdoc-cov]        |
| Open Document Text          | [odt]         | rPNG     | α      | [⚠][odt-issues]         | ![][odt-cov]         |
| HTML                        | [html]        | Extens   | α      | [⚠][html-issues]        | ![][html-cov]        |
| JATS XML                    | [jats]        | Extens   | α      | [⚠][jats-issues]        | ![][jats-cov]        |
| JATS XML (Pandoc-based)     | [jats-pandoc] | Extens   | α      | [⚠][jats-pandoc-issues] | ![][jats-pandoc-cov] |
| Portable Document Format    | [pdf]         | rPNG     | α      | [⚠][pdf-issues]         | ![][pdf-cov]         |
| **Notebooks**               |
| Jupyter                     | [ipynb]       | Native   | α      | [⚠][ipynb-issues]       | ![][ipynb-cov]       |
| RMarkdown                   | [xmd]         | Native   | α      | [⚠][xmd-issues]         | ![][xmd-cov]         |
| **Presentations**           |
| Microsoft Powerpoint        | [pptx]        | rPNG     | ✗      | [⚠][pptx-issues]        |
| Demo Magic                  | [dmagic]      | Native   | β      | [⚠][dmagic-issues]      | ![][dmagic-cov]      |
| **Spreadsheets**            |
| Microsoft Excel             | [xlsx]        | Formula  | β      | [⚠][xlsx-issues]        | ![][xlsx-cov]        |
| Google Sheets               | [gsheet]      | Formula  | ✗      | [⚠][gsheet-issues]      |
| Open Document Spreadsheet   | [ods]         | Formula  | β      | [⚠][ods-issues]         | ![][ods-cov]         |
| **Tabular data**            |
| CSV                         | [csv]         | None     | β      | [⚠][csv-issues]         | ![][csv-cov]         |
| CSVY                        | [csvy]        | None     | ✗      | [⚠][csvy-issues]        |
| Tabular Data Package        | [tdp]         | None     | β      | [⚠][tdp-issues]         | ![][tdp-cov]         |
| **Collections**             |
| Document Archive            | [dar]         | Extens   | ω      | [⚠][dar-issues]         | ![][dar-cov]         |
| Filesystem Directory        | [dir]         | Extens   | ω      | [⚠][dir-issues]         | ![][dir-cov]         |
| **Data interchange, other** |
| JSON                        | [json]        | Native   | ✔      | [⚠][json-issues]        | ![][json-cov]        |
| JSON-LD                     | [json-ld]     | Native   | ✔      | [⚠][jsonld-issues]      | ![][jsonld-cov]      |
| JSON5                       | [json5]       | Native   | ✔      | [⚠][json5-issues]       | ![][json5-cov]       |
| YAML                        | [yaml]        | Native   | ✔      | [⚠][yaml-issues]        | ![][yaml-cov]        |
| Pandoc                      | [pandoc]      | Native   | β      | [⚠][pandoc-issues]      | ![][pandoc-cov]      |
| Reproducible PNG            | [rpng]        | Native   | β      | [⚠][rpng-issues]        | ![][rpng-cov]        |
| **Transport**               |
| HTTP                        | [http]        |          | ✔      | [⚠][http-issues]        | ![][http-cov]        |

**Key**

<details>
  <summary><b id="format-approach">Approach</b>...</summary>
  How executable nodes (e.g. `CodeChunk` and `CodeExpr` nodes) are represented

- Native: the format natively supports executable nodes
- Extens.: executable nodes are supported via extensions to the format
- rPNG: executable nodes are supported via reproducible PNG images
- Formula: executable `CodeExpr` nodes are represented using formulae

</details>

<details>
  <summary><b id="format-status">Status</b>...</summary>

- ✗: Not yet implemented
- ω: Work in progress
- α: Alpha, initial implementation
- β: Beta, ready for user testing
- ✔: Ready for production use

</details>

<details>
  <summary><b id="format-issues">Issues</b>...</summary>
  Link to open issues and PRs for the format (please check there before submitting a new issue 🙏)
</details>

If you'd like to see a converter for your favorite format, look at the [listed issues](https://github.com/stencila/encoda/issues) and comment under the relevant one. If there is no issue regarding the converter you need, [create one](https://github.com/stencila/encoda/issues/new).

## Install

The easiest way to use Encoda is to install the [`stencila` command line tool](https://github.com/stencila/stencila). Encoda powers `stencila convert`, and other commands, in that CLI. However, the version of Encoda in `stencila`, can lag behind the version in this repo. So if you want the latest functionality, install Encoda as a Node.js package:

```bash
npm install @stencila/encoda --global
```

## Use

Encoda is intended to be used primarily as a library for other applications. However, it comes with a simple command line script which allows you to use the `convert` function directly e.g.

```bash
encoda convert notebook.ipynb notebook.docx
```

Encoda will determine the input and output formats based on the file extensions. You can override these using the `--from` and `--to` options. e.g.

```bash
encoda convert notebook.ipynb notebook.xml --to jats
```

You can decode an entire directory into a `Collection`. Encoda will traverse the directory, including subdirectories, decoding each file matching your glob pattern. You can then encode the `Collection` using the `dir` codec into a tree of HTML files e.g.

```bash
encoda convert myproject myproject-published --to dir --pattern '**/*.{rmd, csv}'
```

You can also read content from the first argument. In that case, you'll need to specifying the `--from` format e.g.

```bash
encoda convert "{type: 'Paragraph', content: ['Hello world!']}" --from json5 paragraph.md
```

You can send output to the console by using `-` as the second argument and specifying the `--to` format e.g.

```bash
encoda convert paragraph.md - --to yaml
```

| Option         | Description                                                                               |
| -------------- | ----------------------------------------------------------------------------------------- |
| `--from`       | The format of the input content e.g. `--from md`                                          |
| `--to`         | The format for the output content e.g. `--to html`                                        |
| `--theme`      | The theme for the output (only applies to HTML, PDF and RPNG output) e.g. `--theme eLife` |
| `--standalone` | Generate a standalone document, not a fragment (default `true`)                           |
| `--bundle`     | Bundle all assets (e.g images, CSS and JS) into the document (default `false`)            |
| `--debug`      | Print debugging information                                                               |

## Documentation

Self-hoisted (documentation converted from various formats to html) and API documentation (generated from source code) is available at: https://stencila.github.io/encoda.

## Develop

Check how to [contribute back to the project](https://github.com/stencila/encoda/blob/master/CONTRIBUTING.md). All PRs are most welcome! Thank you!

Clone the repository and install a development environment:

```bash
git clone https://github.com/stencila/encoda.git
cd encoda
npm install
```

Run the test suite:

```bash
npm test
```

Or, run a single test file:

```bash
npx jest tests/xlsx.test.ts
```

To get coverage statistics:

```bash
npm run cover
```

Or, manually test conversion using the `ts-node` and the `cli.ts` script:

```bash
npm run cli -- convert simple.md simple.html
```

There is a bash script to make that a little shorter and more like real life usage:

```bash
./encoda convert simple.md simple.html
```

If that is a bit slow, compile the Typescript to Javascript first and use `node` directly:

```bash
npm run build
node dist/cli convert simple.md simple.html
```

There's also a `Makefile` if you prefer to run tasks that way e.g.

```bash
make lint cover check
```

You can also test using the Docker image for a self-contained, host-independent test environment:

```bash
docker build --tag stencila/encoda .
docker run stencila/encoda
```

## Contribute

We 💕 contributions! All contributions: ideas 🤔, examples 💡, bug reports 🐛, documentation 📖, code 💻, questions 💬. See [CONTRIBUTING.md](CONTRIBUTING.md) for more on where to start. You can also provide your feedback on the [Community Forum](https://community.stenci.la)
and [Gitter channel](https://gitter.im/stencila/stencila).

## Contributors

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore -->
<table><tr><td align="center"><a href="http://stenci.la"><img src="https://avatars2.githubusercontent.com/u/2358535?v=4" width="50px;" alt="Aleksandra Pawlik"/><br /><sub><b>Aleksandra Pawlik</b></sub></a><br /><a href="https://github.com/stencila/encoda/commits?author=apawlik" title="Code">💻</a> <a href="https://github.com/stencila/encoda/commits?author=apawlik" title="Documentation">📖</a> <a href="https://github.com/stencila/encoda/issues?q=author%3Aapawlik" title="Bug reports">🐛</a></td><td align="center"><a href="https://github.com/nokome"><img src="https://avatars0.githubusercontent.com/u/1152336?v=4" width="50px;" alt="Nokome Bentley"/><br /><sub><b>Nokome Bentley</b></sub></a><br /><a href="https://github.com/stencila/encoda/commits?author=nokome" title="Code">💻</a> <a href="https://github.com/stencila/encoda/commits?author=nokome" title="Documentation">📖</a> <a href="https://github.com/stencila/encoda/issues?q=author%3Anokome" title="Bug reports">🐛</a></td><td align="center"><a href="http://toki.io"><img src="https://avatars1.githubusercontent.com/u/10161095?v=4" width="50px;" alt="Jacqueline"/><br /><sub><b>Jacqueline</b></sub></a><br /><a href="https://github.com/stencila/encoda/commits?author=jwijay" title="Documentation">📖</a> <a href="#design-jwijay" title="Design">🎨</a></td><td align="center"><a href="https://github.com/hamishmack"><img src="https://avatars2.githubusercontent.com/u/620450?v=4" width="50px;" alt="Hamish Mackenzie"/><br /><sub><b>Hamish Mackenzie</b></sub></a><br /><a href="https://github.com/stencila/encoda/commits?author=hamishmack" title="Code">💻</a> <a href="https://github.com/stencila/encoda/commits?author=hamishmack" title="Documentation">📖</a></td><td align="center"><a href="http://ketch.me"><img src="https://avatars2.githubusercontent.com/u/1646307?v=4" width="50px;" alt="Alex Ketch"/><br /><sub><b>Alex Ketch</b></sub></a><br /><a href="https://github.com/stencila/encoda/commits?author=alex-ketch" title="Code">💻</a> <a href="https://github.com/stencila/encoda/commits?author=alex-ketch" title="Documentation">📖</a> <a href="#design-alex-ketch" title="Design">🎨</a></td><td align="center"><a href="https://github.com/beneboy"><img src="https://avatars1.githubusercontent.com/u/292725?v=4" width="50px;" alt="Ben Shaw"/><br /><sub><b>Ben Shaw</b></sub></a><br /><a href="https://github.com/stencila/encoda/commits?author=beneboy" title="Code">💻</a> <a href="https://github.com/stencila/encoda/issues?q=author%3Abeneboy" title="Bug reports">🐛</a></td><td align="center"><a href="http://humanrights.washington.edu"><img src="https://avatars2.githubusercontent.com/u/16355618?v=4" width="50px;" alt="Phil Neff"/><br /><sub><b>Phil Neff</b></sub></a><br /><a href="https://github.com/stencila/encoda/issues?q=author%3Aphilneff" title="Bug reports">🐛</a></td></tr><tr><td align="center"><a href="http://rgaiacs.com"><img src="https://avatars0.githubusercontent.com/u/1506457?v=4" width="50px;" alt="Raniere Silva"/><br /><sub><b>Raniere Silva</b></sub></a><br /><a href="https://github.com/stencila/encoda/commits?author=rgaiacs" title="Documentation">📖</a></td></tr></table>

<!-- ALL-CONTRIBUTORS-LIST:END -->

<details>
<summary><b id="format-approach">Add a contributor</b>...</summary>

To add youself, or someone else, to the above list, either,

1. Ask the [@all-contributors bot](https://allcontributors.org/docs/en/bot/overview) to do it for you by commenting on an issue or PR like this:

   > @all-contributors please add @octocat for bugs, tests and code

2. Use the [`all-contributors` CLI](https://allcontributors.org/docs/en/cli/overview) to do it yourself:

   ```bash
   npx all-contributors add octocat bugs, tests, code
   ```

See the list of [contribution types](https://allcontributors.org/docs/en/emoji-key).

</details>

## Acknowledgments

Encoda relies on many awesome opens source tools (see `package.json` for the complete list). We are grateful ❤ to their developers and contributors for all their time and energy. In particular, these tools do a lot of the heavy lifting 💪 under the hood.

| Tool                                                                                                               | Use                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ![Ajv](https://ajv.js.org/images/ajv_logo.png)                                                                     | [Ajv](https://ajv.js.org/) is "the fastest JSON Schema validator for Node.js and browser". Ajv is not only fast, it also has an impressive breadth of functionality. We use Ajv for the `validate()` and `coerce()` functions to ensure that ingested data is valid against the Stencila [schema](https://github.com/stencila/schema).                                                                                                                                                                                                                                                                         |
| ![Citation.js](https://avatars0.githubusercontent.com/u/41587916?s=200&v=4)                                        | [`Citation.js`](https://citation.js.org/) converts bibliographic formats like BibTeX, BibJSON, DOI, and Wikidata to CSL-JSON. We use it to power the codecs for those formats and APIs.                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ![Frictionless Data](https://avatars0.githubusercontent.com/u/5912125?s=200&v=4)                                   | [`datapackage-js`](https://github.com/frictionlessdata/datapackage-js) from the team at [Frictionless Data](https://frictionlessdata.io/) is a Javascript library for working with [Data Packages](https://frictionlessdata.io/specs/data-package/). It does a lot of the work in converting between Tabular Data Packages and Stencila Datatables.                                                                                                                                                                                                                                                            |
| **Pandoc**                                                                                                         | [Pandoc](https://pandoc.org/) is a "universal document converter". It's able to convert between an impressive number of formats for textual documents. Our [Typescript definitions for Pandoc's AST](https://github.com/stencila/encoda/blob/c400d798e6b54ea9f88972b038489df79e38895b/src/pandoc-types.ts) allow us to leverage this functionality from within Node.js while maintaining type safety. Pandoc powers our converters for Word, JATS and Latex. We have contributed to Pandoc, including developing its [JATS reader](https://github.com/jgm/pandoc/blob/master/src/Text/Pandoc/Readers/JATS.hs). |
| ![Puppeteer](https://user-images.githubusercontent.com/10379601/29446482-04f7036a-841f-11e7-9872-91d1fc2ea683.png) | [Puppeteer](https://pptr.dev/) is a Node library which provides a high-level API to control Chrome. We use it to take screenshots of HTML snippets as part of generating rPNGs and we plan to use it for [generating PDFs](https://github.com/stencila/encoda/issues/53).                                                                                                                                                                                                                                                                                                                                      |
| ![Remark](https://avatars2.githubusercontent.com/u/16309564?s=200&v=4)                                             | [`Remark`](https://remark.js.org/) is an ecosystem of plugins for processing Markdown. It's part of the [unified](https://unifiedjs.github.io/) framework for processing text with syntax trees - a similar approach to Pandoc but in Javascript. We use Remark as our Markdown parser because of it's extensibility.                                                                                                                                                                                                                                                                                          |
| ![SheetJs](https://sheetjs.com/sketch128.png)                                                                      | [SheetJs](https://sheetjs.com) is a Javascript library for parsing and writing various spreadhseet formats. We use their [community edition](https://github.com/sheetjs/js-xlsx) to power converters for CSV, Excel, and Open Document Spreadsheet formats. They also have a [pro version](https://sheetjs.com/pro) if you need extra support and functionality.                                                                                                                                                                                                                                               |

Many thanks ❤ to the [Alfred P. Sloan Foundation](https://sloan.org) and [eLife](https://elifesciences.org) for funding development of this tool.

<p align="left">
  <img width="250" src="https://sloan.org/storage/app/media/Logos/Sloan-Logo-stacked-black-web.png">
  <img width="250" src="https://www.force11.org/sites/default/files/elife-full-color-horizontal.png">
</p>

[csv]: src/codecs/csv
[csvy]: src/codecs/csvy
[dar]: src/codecs/dar
[dir]: src/codecs/dir
[dmagic]: src/codecs/dmagic
[docx]: src/codecs/docx
[gdoc]: src/codecs/gdoc
[gsheet]: src/codecs/gsheet
[html]: src/codecs/html
[http]: src/codecs/http
[ipynb]: src/codecs/ipynb
[jats]: src/codecs/jats
[jats-pandoc]: src/codecs/jats-pandoc
[json]: src/codecs/json
[jsonld]: src/codecs/jsonld
[json5]: src/codecs/json5
[latex]: src/codecs/latex
[md]: src/codecs/md
[ods]: src/codecs/ods
[odt]: src/codecs/odt
[pandoc]: src/codecs/pandoc
[pdf]: src/codecs/pdf
[pptx]: src/codecs/pptx
[rpng]: src/codecs/rpng
[tdp]: src/codecs/tdp
[txt]: src/codecs/txt
[xlsx]: src/codecs/xlsx
[xmd]: src/codecs/xmd
[yaml]: src/codecs/yaml
[csv-issues]: https://github.com/stencila/encoda/issues?q=is%3Aopen+csv
[csvy-issues]: https://github.com/stencila/encoda/issues?q=is%3Aopen+csvy
[dar-issues]: https://github.com/stencila/encoda/issues?q=is%3Aopen+dar
[dir-issues]: https://github.com/stencila/encoda/issues?q=is%3Aopen+dir
[dmagic-issues]: https://github.com/stencila/encoda/issues?q=is%3Aopen+dmagic
[docx-issues]: https://github.com/stencila/encoda/issues?q=is%3Aopen+docx
[gdoc-issues]: https://github.com/stencila/encoda/issues?q=is%3Aopen+gdoc
[gsheet-issues]: https://github.com/stencila/encoda/issues?q=is%3Aopen+gsheet
[html-issues]: https://github.com/stencila/encoda/issues?q=is%3Aopen+html
[http-issues]: https://github.com/stencila/encoda/issues?q=is%3Aopen+http
[ipynb-issues]: https://github.com/stencila/encoda/issues?q=is%3Aopen+ipynb
[jats-issues]: https://github.com/stencila/encoda/issues?q=is%3Aopen+jats
[jats-pandoc-issues]: https://github.com/stencila/encoda/issues?q=is%3Aopen+jats
[json-issues]: https://github.com/stencila/encoda/issues?q=is%3Aopen+json
[json5-issues]: https://github.com/stencila/encoda/issues?q=is%3Aopen+json5
[latex-issues]: https://github.com/stencila/encoda/issues?q=is%3Aopen+tex
[md-issues]: https://github.com/stencila/encoda/issues?q=is%3Aopen+markdown
[ods-issues]: https://github.com/stencila/encoda/issues?q=is%3Aopen+ods
[odt-issues]: https://github.com/stencila/encoda/issues?q=is%3Aopen+odt
[pandoc-issues]: https://github.com/stencila/encoda/issues?q=is%3Aopen+pandoc
[pdf-issues]: https://github.com/stencila/encoda/issues?q=is%3Aopen+pdf
[pptx-issues]: https://github.com/stencila/encoda/issues?q=is%3Aopen+pptx
[rpng-issues]: https://github.com/stencila/encoda/issues?q=is%3Aopen+rpng
[tdp-issues]: https://github.com/stencila/encoda/issues?q=is%3Aopen+tdp
[txt-issues]: https://github.com/stencila/encoda/issues?q=is%3Aopen+txt
[xlsx-issues]: https://github.com/stencila/encoda/issues?q=is%3Aopen+xlsx
[xmd-issues]: https://github.com/stencila/encoda/issues?q=is%3Aopen+rmd
[yaml-issues]: https://github.com/stencila/encoda/issues?q=is%3Aopen+yaml
[csv-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/csv
[csvy-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/csvy
[dar-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/dar
[dir-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/dir
[dmagic-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/dmagic
[docx-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/docx
[gdoc-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/gdoc
[gsheet-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/gsheet
[html-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/html
[http-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/http
[ipynb-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/ipynb
[jats-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/jats
[jats-pandoc-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/jats-pandoc
[json-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/json
[jsonld-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/jsonld
[json5-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/json5
[latex-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/latex
[md-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/md
[ods-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/ods
[odt-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/odt
[pandoc-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/pandoc
[pdf-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/pdf
[pptx-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/pptx
[rpng-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/rpng
[tdp-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/tdp
[txt-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/txt
[xlsx-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/xlsx
[xmd-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/xmd
[yaml-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/yaml
