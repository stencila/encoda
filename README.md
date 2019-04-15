## Stencila Converter

![Experimental](https://img.shields.io/badge/status-experimental-orange.svg)
[![Docs](https://img.shields.io/badge/docs-latest-blue.svg)](https://stencila.github.io/convert)
[![NPM](http://img.shields.io/npm/v/stencila-convert.svg?style=flat)](https://www.npmjs.com/package/stencila-convert)
[![Build status](https://travis-ci.org/stencila/convert.svg?branch=master)](https://travis-ci.org/stencila/convert)
[![Build status](https://ci.appveyor.com/api/projects/status/f1hx694pxm0fyqni?svg=true)](https://ci.appveyor.com/project/nokome/convert)
[![Code coverage](https://codecov.io/gh/stencila/convert/branch/master/graph/badge.svg)](https://codecov.io/gh/stencila/convert)
[![Dependency status](https://david-dm.org/stencila/convert.svg)](https://david-dm.org/stencila/convert)

> _Warning_ This repo is undergoing refactoring. As some of this read me is out of date.

Stencila Converters allow you to convert between a range of formats commonly used for "executable documents" (those containing some type of source code or calculation).

### Install

These converters are available as a sub-command in the [Stencila CLI (command line tool)](https://github.com/stencila/cli) e.g. `stencila convert document.md document.jats.xml`. The Stencila CLI is a standalone binary and is the easiest way to use these converters.

If you want to go ahead and install the converters separately you'll need [Node.js](https://nodejs.org/en/download/) and `npm`. Once you have them set up...

- on Mac OS X and Linux, open the terminal,
- on Windows start the Command Prompt or PowerShell, and type:

```bash
npm install stencila-convert -g
```

Some of the text document converters rely on a recent version of Pandoc. This package will use an existing installation of Pandoc if it is new enough. If not, it will automatically download the required Pandoc version to the Stencila directory in your home folder. See [`pandoc.json`](src/helpers/pandoc.json) for the necessary Pandoc version and download URLs. At times it may be necessary to use our custom Pandoc build available at https://github.com/stencila/pandoc/releases.

### Use

```bash
stencila-convert document.md document.jats.xml
```

API documentation is available at https://stencila.github.io/convert.

### Status

The following table lists the status of converters that have been developed, are in development, or are being considered for development.
We'll be developing converters based on demand from users. So if you'd like to see a converter for your favorite format, look at the [listed issues](https://github.com/stencila/convert/issues) and comment under the relevant one. If there is no
issue regarding the converter you need, [create one](https://github.com/stencila/convert/issues/new).

When the converters have been better tested, the plan is to integrate them into [Stencila Desktop](https://github.com/stencila/desktop) as a menu item e.g. `Save as... > Jupyter Notebook`

You can also provide your feedback on the friendly [Stencila Community Forum](https://community.stenci.la)
and [Stencila Gitter channel](https://gitter.im/stencila/stencila).

| Format                                             |                                                         Import                                                         |                           Export                            |
| -------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------: | :---------------------------------------------------------: |
| Markdown                                           | ![alpha](https://img.shields.io/badge/status-alpha-red.svg) <br/> [#23](https://github.com/stencila/convert/issues/23) | ![alpha](https://img.shields.io/badge/status-alpha-red.svg) |
| RMarkdown                                          |                              ![alpha](https://img.shields.io/badge/status-alpha-red.svg)                               |
| Latex                                              |                              ![alpha](https://img.shields.io/badge/status-alpha-red.svg)                               | ![alpha](https://img.shields.io/badge/status-alpha-red.svg) |
| Jupyter Notebook                                   |                              ![alpha](https://img.shields.io/badge/status-alpha-red.svg)                               |
| HTML                                               |                              ![alpha](https://img.shields.io/badge/status-alpha-red.svg)                               | ![alpha](https://img.shields.io/badge/status-alpha-red.svg) |
| PDF                                                |                                                           -                                                            | ![alpha](https://img.shields.io/badge/status-alpha-red.svg) |
| CSV                                                |                              ![alpha](https://img.shields.io/badge/status-alpha-red.svg)                               | ![alpha](https://img.shields.io/badge/status-alpha-red.svg) |
| Yaml Front matter for CSV [CSVY](http://csvy.org/) |                                  [#25](https://github.com/stencila/convert/issues/25)                                  |    [#26](https://github.com/stencila/convert/issues/26)     |
| Tabular Data Package                               |                                                                                                                        |
| Sheet Script                                       |                                  [#29](https://github.com/stencila/convert/issues/29)                                  |    [#28](https://github.com/stencila/convert/issues/28)     |
| Yaml Front matter for CSV [CSVY](http://csvy.org/) |                                  [#25](https://github.com/stencila/convert/issues/25)                                  |    [#26](https://github.com/stencila/convert/issues/26)     |
| X Markdown                                         |                                                                                                                        |

### Develop

Clone the repository and install a development environment (again, you need Node.js to do it):

```bash
git clone https://github.com/stencila/convert.git
cd convert
npm install
```

Check how to [contribute back to the project](https://github.com/stencila/convert/blob/master/CONTRIBUTING.md). All PRs are most welcome! Thank you!

### Test

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

Or, manually test conversion using the bin script on test cases:

```bash
npx ts-node src/cli.ts tests/fixtures/datatable/simple/simple.csv --to yaml
```

There's also a `Makefile` if you prefer to run tasks that way e.g.

```bash
make lint cover check
```

You can also test using the Docker image for a self-contained, host-independent test environment:

```bash
docker build --tag stencila/convert .
docker run stencila/convert
```

#### Test cases

The tests are currently doing a "round trip" conversion. That is, a test case is:

1. Converted to a temporary file in pandoc JSON format.
2. The temporary file in pandoc JSON format is converted into
   a [pandoc pandoc’s intermediate representation of the document, AST)[https://pandoc.org/using-the-pandoc-api.html].
3. The pandoc document is converted into an executable document.
4. The executable document is converted into a pandoc document in JSON format
   (compare [Stencila API](https://github.com/stencila/specs)).
5. The pandoc document is converted into a temporary file in pandoc JSON format.
6. The temporary file in pandoc JSON is converted into a file in the same format
   as the test case (with `-out` added to the original name).
7. The test case (input file) is then compared with the result of the
   round trip conversion file. For example, `input.md` is compared with `input-out.me`; `input.ipynb` with `input-out.ipynb` and so on.

To look up the details of the above conversion steps, see the
[`PandocConverter.js`](https://github.com/stencila/convert/blob/master/src/PandocConverter.js) file.

##### Test case alternatives

"Round trip" testing checks allows for testing conversions of alternatives for
input formats. For example, Atx-style headers (tagged with `#`) in a Markdown file should be treated the same as Setext-style headers (tagged with `----` under the header text) during conversion. That is,

```
# Atx- style Header example
```

is converted into the same output as the one below:

```
Setext-style Header example
-------------
```

To make testing more succinct we have a convention of extending test case file names with "-alternative" (dash alternative), for example, `heading.md` and `heading-setext.md`. Since the headings should be converted the same way,
`heading-setext-out.md` is compared to `heading.md`.
(Another way to think about this approach is to treat the conversion as
standardising the input formats to pandoc Reader / Writer options.)

**Note** The above test regime tests primarily pandoc conventions for
reading from and writing to different formats, (pandoc Reader and Writer options)[https://pandoc.org/MANUAL.html#options].

##### Create new test cases

You can create a new test case for a particular format by converting an existing tests case for another format. For example, to create a nested lists test case for JATS, you could use the existing test case for Markdown:

```bash
./bin/stencila-convert.js tests/fixtures/list_nested.md tests/fixtures/list_nested.jats.xml
```

## Get in touch!

If you have any questions or comments, please join our [friendly Gitter chat](https://gitter.im/stencila/stencila)!
