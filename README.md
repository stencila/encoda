# Encoda

##### Codecs for structured, semantic, composable, and executable documents

[![Build status](https://dev.azure.com/stencila/stencila/_apis/build/status/stencila.encoda?branchName=master)](https://dev.azure.com/stencila/stencila/_build/latest?definitionId=1&branchName=master)
[![Code coverage](https://codecov.io/gh/stencila/encoda/branch/master/graph/badge.svg)](https://codecov.io/gh/stencila/encoda)
[![NPM](https://img.shields.io/npm/v/@stencila/encoda.svg?style=flat)](https://www.npmjs.com/package/@stencila/encoda)
[![Docs](https://img.shields.io/badge/docs-latest-blue.svg)](https://stencila.github.io/encoda/)

<!-- Automatically generated TOC. Don't edit, `make docs` instead>

<!-- toc -->

- [Encoda](#encoda) - [Codecs for structured, semantic, composable, and executable documents](#codecs-for-structured-semantic-composable-and-executable-documents)
  - [Introduction](#introduction)
  - [Formats](#formats)
  - [Publishers](#publishers)
  - [Install](#install)
  - [Use](#use)
    - [Converting files](#converting-files)
    - [Converting folders](#converting-folders)
    - [Converting command line input](#converting-command-line-input)
    - [Using with Executa](#using-with-executa)
  - [Documentation](#documentation)
  - [Develop](#develop)
  - [Testing](#testing)
    - [Running tests locally](#running-tests-locally)
    - [Running test in Docker](#running-test-in-docker)
  - [Writing tests](#writing-tests)
    - [Recording and using network fixtures](#recording-and-using-network-fixtures)
  - [Contribute](#contribute)
  - [Contributors](#contributors)
  - [Acknowledgments](#acknowledgments)

<!-- tocstop -->

## Introduction

> "A codec is a device or computer program for encoding or decoding a digital data stream or signal. Codec is a portmanteau of coder-decoder. - [Wikipedia](https://en.wikipedia.org/wiki/Codec)

Encoda provides a collection of codecs for converting between, and composing together, documents in various formats. The aim is not to achieve perfect lossless conversion between alternative document formats; there are already several tools for that. Instead the focus of Encoda is to use existing tools to encode and compose semantic documents in alternative formats.

## Formats

As far as possible, Encoda piggybacks on top of existing tools for parsing and serializing documents in various formats. It uses [extensions to schema.org](https://github.com/stencila/schema) as the central data model for all documents and for many formats, it simply transforms the data model of the external tool (e.g. [Pandoc types](https://hackage.haskell.org/package/pandoc-types), [SheetJS spreadsheet model](https://github.com/SheetJS/sheetjs/blob/master/types/index.d.ts)) to that schema ("decoding") and back again ("encoding"). In this sense, you can think of Encoda as a [Rosetta Stone](https://en.wikipedia.org/wiki/Rosetta_Stone) with schema.org at it's centre.

> ⚡ Tip: If a codec for your favorite format is missing below, see if there is already an [issue](https://github.com/stencila/encoda/issues) for it and 👍 or comment. If there is no issue regarding the converter you need, feel free to [create one](https://github.com/stencila/encoda/issues/new).

| Format                       | Codec         | Powered by             | Status | Coverage             |
| ---------------------------- | ------------- | ---------------------- | ------ | -------------------- |
| **Text**                     |
| Plain text                   | [txt]         | [`toString`][tostring] | ✔      | ![][txt-cov]         |
| Markdown                     | [md]          | [Remark]               | ✔      | ![][md-cov]          |
| LaTex                        | [latex]       | [Pandoc][pandoc-org]   | α      | ![][latex-cov]       |
| Microsoft Word               | [docx]        | [Pandoc][pandoc-org]   | β      | ![][docx-cov]        |
| Google Docs                  | [gdoc]        | [`JSON`][json-api]     | β      | ![][gdoc-cov]        |
| Open Document Text           | [odt]         | [Pandoc][pandoc-org]   | α      | ![][odt-cov]         |
| HTML                         | [html]        | [jsdom], [hyperscript] | ✔      | ![][html-cov]        |
| JATS XML                     | [jats]        | [xml-js]               | ✔      | ![][jats-cov]        |
|                              | [jats-pandoc] | [Pandoc][pandoc-org]   | β      | ![][jats-pandoc-cov] |
| Portable Document Format     | [pdf]         | [pdf-lib], [Puppeteer] | β      | ![][pdf-cov]         |
| **Math**                     |
| TeX                          | [tex]         | [mathconverter]        | ✔      | ![][tex-cov]         |
| MathML                       | [mathml]      | [MathJax]              | ✔      | ![][mathml-cov]      |
| **Visualization**            |
| Plotly                       | [plotly]      | [Plotly.js]            | ✔      | ![][plotly-cov]      |
| Vega / Vega-Lite             | [vega]        | [Vega][vega-io]        | ✔      | ![][vega-cov]        |
| **Bibliographic**            |
| Citation Style Language JSON | [csl]         | [Citation.js]          | ✔      | ![][csl-cov]         |
| BibTeX                       | [bib]         | [Citation.js]          | ✔      | ![][bib-cov]         |
| **Notebooks**                |
| Jupyter                      | [ipynb]       | [`JSON`][json-api]     | ✔      | ![][ipynb-cov]       |
| RMarkdown                    | [xmd]         | [Remark]               | ✔      | ![][xmd-cov]         |
| **Spreadsheets**             |
| Microsoft Excel              | [xlsx]        | [SheetJS]              | β      | ![][xlsx-cov]        |
| Open Document Spreadsheet    | [ods]         | [SheetJS]              | β      | ![][ods-cov]         |
| **Tabular data**             |
| CSV                          | [csv]         | [SheetJS]              | β      | ![][csv-cov]         |
| Tabular Data Package         | [tdp]         | [datapackage-js]       | α      | ![][tdp-cov]         |
| **Collections**              |
| Filesystem Directory         | [dir]         | [`fs`][fs]             | β      | ![][dir-cov]         |
| **Data interchange, other**  |
| JSON                         | [json]        | [`JSON`][json-api]     | ✔      | ![][json-cov]        |
| JSON-LD                      | [jsonld]      | [jsonld.js]            | ✔      | ![][jsonld-cov]      |
| JSON5                        | [json5]       | [json5][json5-org]     | ✔      | ![][json5-cov]       |
| YAML                         | [yaml]        | [js-yaml]              | ✔      | ![][yaml-cov]        |
| Pandoc                       | [pandoc]      | [Pandoc][pandoc-org]   | ✔      | ![][pandoc-cov]      |
| Reproducible PNG             | [rpng]        | [Puppeteer]            | ✔      | ![][rpng-cov]        |
| XML                          | [xml]         | [xml-js]               | ✔      | ![][xml-cov]         |

<!-- Codecs -->

[bib]: src/codecs/bib
[crossref]: src/codecs/crossref
[csl]: src/codecs/csl
[csv]: src/codecs/csv
[dar]: src/codecs/dar
[dir]: src/codecs/dir
[dmagic]: src/codecs/dmagic
[docx]: src/codecs/docx
[doi]: src/codecs/doi
[elife]: src/codecs/elife
[gdoc]: src/codecs/gdoc
[html]: src/codecs/html
[http]: src/codecs/http
[ipynb]: src/codecs/ipynb
[jats-pandoc]: src/codecs/jats-pandoc
[jats]: src/codecs/jats
[json]: src/codecs/json
[json5]: src/codecs/json5
[jsonld]: src/codecs/jsonld
[latex]: src/codecs/latex
[mathml]: src/codecs/mathml
[md]: src/codecs/md
[ods]: src/codecs/ods
[odt]: src/codecs/odt
[orcid]: src/codecs/orcid
[pandoc]: src/codecs/pandoc
[pdf]: src/codecs/pdf
[plos]: src/codecs/plos
[plotly]: src/codecs/plotly
[rpng]: src/codecs/rpng
[tdp]: src/codecs/tdp
[tex]: src/codecs/tex
[txt]: src/codecs/txt
[vega]: src/codecs/vega
[xlsx]: src/codecs/xlsx
[xmd]: src/codecs/xmd
[xml]: src/codecs/xml
[yaml]: src/codecs/yaml

<!-- Dependencies -->

[citation.js]: https://citation.js.org/
[datapackage-js]: https://github.com/frictionlessdata/datapackage-js
[fs]: https://nodejs.org/api/fs.html
[hyperscript]: https://github.com/hyperhype/hyperscript
[js-yaml]: https://github.com/nodeca/js-yaml#readme
[jsdom]: https://github.com/jsdom/jsdom
[json-api]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON
[json5-org]: https://json5.org/
[jsonld.js]: https://github.com/digitalbazaar/jsonld.js
[mathconverter]: https://github.com/oerpub/mathconverter
[mathjax]: https://www.mathjax.org/
[pandoc-org]: https://pandoc.org/
[pdf-lib]: https://pdf-lib.js.org/
[plotly.js]: https://plotly.com/javascript/
[puppeteer]: https://pptr.dev/
[remark]: https://remark.js.org/
[sheetjs]: https://sheetjs.com
[tostring]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/toString
[vega-io]: https://vega.github.io/vega/
[xml-js]: https://github.com/nashwaan/xml-js#readme

<!-- Coverage -->

[bib-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/bib
[crossref-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/crossref
[csl-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/csl
[csv-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/csv
[csvy-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/csvy
[dar-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/dar
[dir-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/dir
[dmagic-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/dmagic
[docx-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/docx
[doi-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/doi
[elife-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/elife
[gdoc-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/gdoc
[gsheet-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/gsheet
[html-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/html
[http-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/http
[ipynb-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/ipynb
[jats-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/jats
[jats-pandoc-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/jats-pandoc
[json-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/json
[json5-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/json5
[jsonld-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/jsonld
[latex-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/latex
[mathml-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/mathml
[md-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/md
[ods-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/ods
[odt-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/odt
[orcid-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/orcid
[pandoc-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/pandoc
[pdf-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/pdf
[plos-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/plos
[plotly-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/plotly
[pptx-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/pptx
[rpng-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/rpng
[tdp-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/tdp
[tex-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/tex
[txt-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/txt
[vega-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/vega
[xlsx-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/xlsx
[xmd-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/xmd
[xml-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/xml
[yaml-cov]: https://badger.nokome.now.sh/codecov-folder/stencila/encoda/src/codecs/yaml

**Key**

- ✗: Not yet implemented
- α: Alpha, initial implementation
- β: Beta, ready for user testing
- ✔: Ready for production use

## Publishers

Several of the codecs in Encoda, deal with fetching content from a particular publisher. For example, to get an eLife article and read it in Markdown:

```bash
stencila convert https://elifesciences.org/articles/45187v2 ye-et-al-2019.md
```

Some of these publisher codecs deal with meta data. e.g.

```bash
stencila convert "Watson and Crick 1953" - --from crossref --to yaml
```

```yaml
type: Article
title: Genetical Implications of the Structure of Deoxyribonucleic Acid
authors:
  - familyNames:
      - WATSON
    givenNames:
      - J. D.
    type: Person
  - familyNames:
      - CRICK
    givenNames:
      - F. H. C.
    type: Person
datePublished: '1953,5'
isPartOf:
  issueNumber: '4361'
  isPartOf:
    volumeNumber: '171'
    isPartOf:
      title: Nature
      type: Periodical
    type: PublicationVolume
  type: PublicationIssue
```

| Source                 | Codec      | Base codec/s                         | Status | Coverage          |
| ---------------------- | ---------- | ------------------------------------ | ------ | ----------------- |
| **General**            |
| HTTP                   | [http]     | Based on `Content-Type` or extension | β      | ![][http-cov]     |
| **`Person`**           |
| ORCID                  | [orcid]    | `jsonld`                             | β      | ![][orcid-cov]    |
| **`Article` metadata** |
| DOI                    | [doi]      | `csl`                                | β      | ![][doi-cov]      |
| Crossref               | [crossref] | `jsonld`                             | β      | ![][crossref-cov] |
| **`Article` content**  |
| eLife                  | [elife]    | `jats`                               | β      | ![][elife-cov]    |
| PLoS                   | [plos]     | `jats`                               | β      | ![][plos-cov]     |

## Install

The easiest way to use Encoda is to install the [`stencila` command line tool](https://github.com/stencila/stencila). Encoda powers `stencila convert`, and other commands, in that CLI. However, the version of Encoda in `stencila`, can lag behind the version in this repo. So if you want the latest functionality, install Encoda as a Node.js package:

```bash
npm install @stencila/encoda --global
```

## Use

Encoda is intended to be used primarily as a library for other applications. However, it comes with a simple command line script which allows you to use the `convert` function directly.

### Converting files

```bash
encoda convert notebook.ipynb notebook.docx
```

Encoda will determine the input and output formats based on the file extensions. You can override these using the `--from` and `--to` options. e.g.

```bash
encoda convert notebook.ipynb notebook.xml --to jats
```

You can also convert to more than one file / format (in this case the `--to` argument only applies to the first output file) e.g.

```bash
encoda convert report.docx report.Rmd report.html report.jats
```

### Converting folders

You can decode an entire directory into a `Collection`. Encoda will traverse the directory, including subdirectories, decoding each file matching your glob pattern. You can then encode the `Collection` using the `dir` codec into a tree of HTML files e.g.

```bash
encoda convert myproject myproject-published --to dir --pattern '**/*.{rmd, csv}'
```

### Converting command line input

You can also read content from the first argument. In that case, you'll need to specifying the `--from` format e.g.

```bash
encoda convert "{type: 'Paragraph', content: ['Hello world!']}" --from json5 paragraph.md
```

You can send output to the console by using `-` as the second argument and specifying the `--to` format e.g.

```bash
encoda convert paragraph.md - --to yaml
```

| Option         | Description                                                                                                                                                                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--from`       | The format of the input content e.g. `--from md`                                                                                                                                                                                                         |
| `--to`         | The format for the output content e.g. `--to html`                                                                                                                                                                                                       |
| `--theme`      | The theme for the output (only applies to HTML, PDF and RPNG output) e.g. `--theme eLife`. Either a [Thema theme name](https://github.com/stencila/thema#available-themes) or a path/URL to a directory containing a `styles.css` and a `index.js` file. |
| `--standalone` | Generate a standalone document, not a fragment (default `true`)                                                                                                                                                                                          |
| `--bundle`     | Bundle all assets (e.g images, CSS and JS) into the document (default `false`)                                                                                                                                                                           |
| `--debug`      | Print debugging information                                                                                                                                                                                                                              |

### Using with Executa

Encoda exposes the `decode` and `encode` methods of the [Executa](https://github.com/stencila/executa) API. Register Encoda so that it can be discovered by other executors on your machine,

```bash
npm run register
```

You can then use Encoda as a plugin for Executa that provides additional format conversion capabilities. For example, you can use the `query` REPL on a Markdown document:

```bash
npx executa query CHANGELOG.md --repl
```

You can then use the REPL to explore the structure of the document and do things like create summary documents from it. For example, lets say from some reason we wanted to create a short JATS XML file with the five most recent releases of this package:

```
jmp > %format jats
jmp > %dest latest-releases.jats.xml
jmp > {type: 'Article', content: content[? type==`Heading` && depth==`1`] | [1:5]}
```

Which creates the `latest-major-releases.jats.xml` file:

```xml
<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE article PUBLIC "-//NLM//DTD JATS (Z39.96) Journal Archiving and Interchange DTD v1.1 20151215//EN" "JATS-archivearticle1.dtd">
<article xmlns:xlink="http://www.w3.org/1999/xlink" article-type="research-article">
    <front>
        <title-group>
            <article-title/>
        </title-group>
        <contrib-group/>
    </front>
    <body>
        <sec>
            <title>
                <ext-link ext-link-type="uri" xlink:href="https://github.com/stencila/encoda/compare/v0.79.0...v0.80.0">0.80.0</ext-link> (2019-09-30)
            </title>
        </sec>
...
```

You can query a document in any format supported by Encoda. As another example, lets' fetch a CSV file from Github and get the names of it's columns:

```bash
npx executa query https://gist.githubusercontent.com/jncraton/68beb88e6027d9321373/raw/381dcf8c0d4534d420d2488b9c60b1204c9f4363/starwars.csv --repl
🛈 INFO  encoda:http Fetching "https://gist.githubusercontent.com/jncraton/68beb88e6027d9321373/raw/381dcf8c0d4534d420d2488b9c60b1204c9f4363/starwars.csv"
jmp > columns[].name
[
  'SetID',
  'Number',
  'Variant',
  'Theme',
  'Subtheme',
  'Year',
  'Name',
  'Minifigs',
  'Pieces',
  'UKPrice',
  'USPrice',
  'CAPrice',
  'EUPrice',
  'ImageURL',
  'Owned',
  'Wanted',
  'QtyOwned',
]
jmp >
```

See the `%help` REPL command for more examples.

Note: If you have [`executa`](https://github.com/stencila/executa) installed globally, then the `npx` prefix above is not necessary.

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

You can manually test conversion using the `ts-node` and the `cli.ts` script:

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

If you are using VSCode, you can use the [Auto Attach feature](https://code.visualstudio.com/docs/nodejs/nodejs-debugging#_auto-attach-feature) to attach to the CLI when running the `cli:debug` NPM script:

```bash
npm run cli:debug -- convert simple.gdoc simple.ipynb
```

## Testing

### Running tests locally

Run the test suite using:

```bash
npm test
```

Or, run a single test file e.g.

```bash
npx jest tests/xlsx.test.ts --watch
```

To display debug logs during testing set the environment variable `DEBUG=1`, e.g.

```bash
DEBUG=1 npm test
```

To get coverage statistics:

```bash
npm run cover
```

There's also a `Makefile` if you prefer to run tasks that way e.g.

```bash
make lint cover
```

### Running test in Docker

You can also test this package using with a Docker container:

```bash
npm run test:docker
```

## Writing tests

#### Recording and using network fixtures

As far as possible, tests should be able to run with no network access. We use [Nock Back](https://github.com/nock/nock#nock-back) to record and play back network requests and responses. Use the `nockRecord` helper function for this with the convention of starting the fixture file with `nock-record-` e.g.

```ts
const stopRecording = await nockRecord('nock-record-<name-of-test>.json')
// Do some things that connect to the interwebs
stopRecording()
```

Note that the HTTP fetcher implements caching so that you may need to remove the cache for the recording of fixtures to work e.g. `rm -rf /tmp/stencila/encoda/cache/`.

If there are changes in the URLs that your test fetches, or you want to check that your test is still works against an external API that may have changed, remove the Nock recording and rerun the test e.g.,

```sh
rm src/codecs/elife/__fixtures__/nock-record-*.json
npx jest src/codecs/elife/ --testTimeout 30000
```

## Contribute

We 💕 contributions! All contributions: ideas 🤔, examples 💡, bug reports 🐛, documentation 📖, code 💻, questions 💬. See [CONTRIBUTING.md](CONTRIBUTING.md) for more on where to start. You can also provide your feedback on the [Community Forum](https://community.stenci.la)
and [Gitter channel](https://gitter.im/stencila/stencila).

## Contributors

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="http://stenci.la"><img src="https://avatars2.githubusercontent.com/u/2358535?v=4" width="50px;" alt=""/><br /><sub><b>Aleksandra Pawlik</b></sub></a><br /><a href="https://github.com/stencila/encoda/commits?author=apawlik" title="Code">💻</a> <a href="https://github.com/stencila/encoda/commits?author=apawlik" title="Documentation">📖</a> <a href="https://github.com/stencila/encoda/issues?q=author%3Aapawlik" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://github.com/nokome"><img src="https://avatars0.githubusercontent.com/u/1152336?v=4" width="50px;" alt=""/><br /><sub><b>Nokome Bentley</b></sub></a><br /><a href="https://github.com/stencila/encoda/commits?author=nokome" title="Code">💻</a> <a href="https://github.com/stencila/encoda/commits?author=nokome" title="Documentation">📖</a> <a href="https://github.com/stencila/encoda/issues?q=author%3Anokome" title="Bug reports">🐛</a></td>
    <td align="center"><a href="http://toki.io"><img src="https://avatars1.githubusercontent.com/u/10161095?v=4" width="50px;" alt=""/><br /><sub><b>Jacqueline</b></sub></a><br /><a href="https://github.com/stencila/encoda/commits?author=jwijay" title="Documentation">📖</a> <a href="#design-jwijay" title="Design">🎨</a></td>
    <td align="center"><a href="https://github.com/hamishmack"><img src="https://avatars2.githubusercontent.com/u/620450?v=4" width="50px;" alt=""/><br /><sub><b>Hamish Mackenzie</b></sub></a><br /><a href="https://github.com/stencila/encoda/commits?author=hamishmack" title="Code">💻</a> <a href="https://github.com/stencila/encoda/commits?author=hamishmack" title="Documentation">📖</a></td>
    <td align="center"><a href="http://ketch.me"><img src="https://avatars2.githubusercontent.com/u/1646307?v=4" width="50px;" alt=""/><br /><sub><b>Alex Ketch</b></sub></a><br /><a href="https://github.com/stencila/encoda/commits?author=alex-ketch" title="Code">💻</a> <a href="https://github.com/stencila/encoda/commits?author=alex-ketch" title="Documentation">📖</a> <a href="#design-alex-ketch" title="Design">🎨</a></td>
    <td align="center"><a href="https://github.com/beneboy"><img src="https://avatars1.githubusercontent.com/u/292725?v=4" width="50px;" alt=""/><br /><sub><b>Ben Shaw</b></sub></a><br /><a href="https://github.com/stencila/encoda/commits?author=beneboy" title="Code">💻</a> <a href="https://github.com/stencila/encoda/issues?q=author%3Abeneboy" title="Bug reports">🐛</a></td>
    <td align="center"><a href="http://humanrights.washington.edu"><img src="https://avatars2.githubusercontent.com/u/16355618?v=4" width="50px;" alt=""/><br /><sub><b>Phil Neff</b></sub></a><br /><a href="https://github.com/stencila/encoda/issues?q=author%3Aphilneff" title="Bug reports">🐛</a></td>
  </tr>
  <tr>
    <td align="center"><a href="http://rgaiacs.com"><img src="https://avatars0.githubusercontent.com/u/1506457?v=4" width="50px;" alt=""/><br /><sub><b>Raniere Silva</b></sub></a><br /><a href="https://github.com/stencila/encoda/commits?author=rgaiacs" title="Documentation">📖</a></td>
    <td align="center"><a href="https://people.unipi.it/lorenzo_cangiano/"><img src="https://avatars1.githubusercontent.com/u/11914162?v=4" width="50px;" alt=""/><br /><sub><b>Lorenzo Cangiano</b></sub></a><br /><a href="https://github.com/stencila/encoda/issues?q=author%3Alollopus" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://github.com/FAtherden-eLife"><img src="https://avatars2.githubusercontent.com/u/43879983?v=4" width="50px;" alt=""/><br /><sub><b>FAtherden-eLife</b></sub></a><br /><a href="https://github.com/stencila/encoda/issues?q=author%3AFAtherden-eLife" title="Bug reports">🐛</a> <a href="#design-FAtherden-eLife" title="Design">🎨</a></td>
    <td align="center"><a href="https://giorgiosironi.com"><img src="https://avatars3.githubusercontent.com/u/160299?v=4" width="50px;" alt=""/><br /><sub><b>Giorgio Sironi</b></sub></a><br /><a href="https://github.com/stencila/encoda/pulls?q=is%3Apr+reviewed-by%3Agiorgiosironi" title="Reviewed Pull Requests">👀</a></td>
  </tr>
</table>

<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->

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

| Tool                                                                                                               | Use                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ![Ajv](https://ajv.js.org/images/ajv_logo.png)                                                                     | [Ajv](https://ajv.js.org/) is "the fastest JSON Schema validator for Node.js and browser". Ajv is not only fast, it also has an impressive breadth of functionality. We use Ajv for the `validate()` and `coerce()` functions to ensure that ingested data is valid against the Stencila [schema](https://github.com/stencila/schema).                                                                                                                                                                                                                                                    |
| ![Citation.js](https://avatars0.githubusercontent.com/u/41587916?s=200&v=4)                                        | [Citation.js] converts bibliographic formats like BibTeX, BibJSON, DOI, and Wikidata to CSL-JSON. We use it to power the codecs for those formats and APIs.                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ![Frictionless Data](https://avatars0.githubusercontent.com/u/5912125?s=200&v=4)                                   | [`datapackage-js`](https://github.com/frictionlessdata/datapackage-js) from the team at [Frictionless Data](https://frictionlessdata.io/) is a Javascript library for working with [Data Packages](https://frictionlessdata.io/specs/data-package/). It does a lot of the work in converting between Tabular Data Packages and Stencila Datatables.                                                                                                                                                                                                                                       |
| ![Glitch Digital](https://avatars1.githubusercontent.com/u/16604593?s=200&v=4)                                     | Glitch Digital's [`structured-data-testing-tool`](https://github.com/glitchdigital/structured-data-testing-tool) is a library and command line tool to help inspect and test for Structured Data. We use it to check that the HTML generated by Encoda can be read by bots 🤖                                                                                                                                                                                                                                                                                                             |
| ![Pa11y](https://pa11y.org/resources/brand/logo.svg)                                                               | [Pa11y](https://pa11y.org/) provides a range of free and open source tools to help designers and developers make their web pages more accessible. We use [`pa11y`](https://github.com/pa11y/pa11y) to test that HTML generated produced by Encoda meets the [Web Content Accessibility Guidelines (WCAG)](https://www.w3.org/TR/WCAG20/) and [Axe](https://dequeuniversity.com/rules/axe/3.5) rule set.                                                                                                                                                                                   |
| **Pandoc**                                                                                                         | [Pandoc] is a "universal document converter". It's able to convert between an impressive number of formats for textual documents. Our [Typescript definitions for Pandoc's AST](https://github.com/stencila/encoda/blob/c400d798e6b54ea9f88972b038489df79e38895b/src/pandoc-types.ts) allow us to leverage this functionality from within Node.js while maintaining type safety. Pandoc powers our converters for Word, JATS and Latex. We have contributed to Pandoc, including developing its [JATS reader](https://github.com/jgm/pandoc/blob/master/src/Text/Pandoc/Readers/JATS.hs). |
| ![Puppeteer](https://user-images.githubusercontent.com/10379601/29446482-04f7036a-841f-11e7-9872-91d1fc2ea683.png) | [Puppeteer] is a Node library which provides a high-level API to control Chrome. We use it to take screenshots of HTML snippets as part of generating rPNGs and we plan to use it for [generating PDFs](https://github.com/stencila/encoda/issues/53).                                                                                                                                                                                                                                                                                                                                    |
| ![Remark](https://avatars2.githubusercontent.com/u/16309564?s=200&v=4)                                             | [Remark] is an ecosystem of plugins for processing Markdown. It's part of the [unified](https://unifiedjs.github.io/) framework for processing text with syntax trees - a similar approach to Pandoc but in Javascript. We use Remark as our Markdown parser because of it's extensibility.                                                                                                                                                                                                                                                                                               |
| ![SheetJs](https://sheetjs.com/sketch128.png)                                                                      | [SheetJs] is a Javascript library for parsing and writing various spreadsheet formats. We use their [community edition](https://github.com/sheetjs/js-xlsx) to power converters for CSV, Excel, and Open Document Spreadsheet formats. They also have a [pro version](https://sheetjs.com/pro) if you need extra support and functionality.                                                                                                                                                                                                                                               |

Many thanks ❤ to the [Alfred P. Sloan Foundation](https://sloan.org) and [eLife](https://elifesciences.org) for funding development of this tool.

<p align="left">
  <img width="250" src="https://sloan.org/storage/app/media/Logos/Sloan-Logo-stacked-black-web.png">
  <img width="250" src="https://www.force11.org/sites/default/files/elife-full-color-horizontal.png">
</p>
