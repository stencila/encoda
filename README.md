## `stencila/convert` : Stencila converters

![Experimental](https://img.shields.io/badge/stability-experimental-orange.svg)
[![Docs](https://img.shields.io/badge/docs-latest-blue.svg)](https://stencila.github.io/convert)
[![NPM](http://img.shields.io/npm/v/stencila-convert.svg?style=flat)](https://www.npmjs.com/package/stencila-convert)
[![Build status](https://travis-ci.org/stencila/convert.svg?branch=master)](https://travis-ci.org/stencila/convert)
[![Build status](https://ci.appveyor.com/api/projects/status/f1hx694pxm0fyqni?svg=true)](https://ci.appveyor.com/project/nokome/convert)
[![Code coverage](https://codecov.io/gh/stencila/convert/branch/master/graph/badge.svg)](https://codecov.io/gh/stencila/convert)
[![Dependency status](https://david-dm.org/stencila/convert.svg)](https://david-dm.org/stencila/convert)


Stencila Converters allow you to convert between a range of formats commonly used for among researchers (and not only). Converters support
lossless conversion of interactive source code sections and (most of the time) formatting. This means that you can seamlessly collaborate with colleagues
who prefer other than you interfaces, without yourself having to give up your tool of choice.

Stencila Converters are using the awesome power of [pandoc](https://pandoc.org/). In particular, Stencila relies much on pandoc's own JSON format
(see below for developer's documentation).



### Install

Currently you need [Node.js](https://nodejs.org/en/download/) and npm to install Stencila Converters. Once you have it set up on your machine,

* on Mac OS X and Linux, open the terminal,
* on Windows start the Command Prompt or PowerShell, and type:

```bash
npm install stencila-convert -g
```

Many of the `Document` converters rely on a recent version of Pandoc. This package will use an existing installation of Pandoc if it is new enough. If not, it will automatically download the required Pandoc version to the Stencila directory in your home folder. See [`pandoc.json`](src/helpers/pandoc.json) for the necessary Pandoc version and download URLs. At times it may be necessary to use our custom Pandoc build available at https://github.com/stencila/pandoc/releases.


### Use

```bash
stencila-convert document.md document.jats.xml
```

When these converters are better developed and tested, the plan is to integrate this package into:

- the [Stencila CLI (command line tool)](https://github.com/stencila/cli) as a sub-command e.g. `stencila convert document.md document.jats.xml`

- the [Stencila Desktop](https://github.com/stencila/desktop) as a menu item e.g. `Save as... > Jupyter Notebook`

API documentation is available at https://stencila.github.io/convert.


### Status

The following table lists the status of converters that have been developed, are in development, or are being considered for development.
We'll be developing converters based on demand from users. So if you'd like to see a converter for your favorite format, look at the [listed issues](https://github.com/stencila/convert/issues) and comment under the relevant one. If there is no
issue regarding the converter you need, [create one](https://github.com/stencila/convert/issues/new).

You can also provide your feedback on the friendly [Sthttps://github.com/stencila/convert/issues/24encila Community Forum](https://community.stenci.la)
and [Stencila Gitter channel](https://gitter.im/stencila/stencila).


Format          | Import                                                           | Export
--------------- | :--------------------------------------------------------------: | :--------------------------------------------------------------:
Delimiter Separated Values  | [#30](https://github.com/stencila/convert/issues/30) | [#29](https://github.com/stencila/convert/issues/30)
HTML            |         |   
JSON            |  ✔️       | ✔️
JATS            |          |
Jupyter Notebook|         |                                                          
Latex           |          |
Markdown        |  ✔️  <br/> [#23](https://github.com/stencila/convert/issues/23)   |
Microsoft Excel `.xlsx`   |        |
Microsoft Word `.docx`| [#24](https://github.com/stencila/convert/issues/24) | [#24](https://github.com/stencila/convert/issues/24)
Open Document Spreadsheet `.ods`|   |  
Open Document Text | |
PDF             |      |    
RMarkdown       |  ✔️      |
Tabular Data Package |                                                             |
Sheet Script    |  [#29](https://github.com/stencila/convert/issues/29)  | [#28](https://github.com/stencila/convert/issues/28)
Yaml Front matter for CSV [CSVY](http://csvy.org/) |  [#25](https://github.com/stencila/convert/issues/25)   |   [#26](https://github.com/stencila/convert/issues/26)
X Markdown | |

### Develop

Clone the repository and install a development environment (again, you need Node.js to do it):

```bash
git clone https://github.com/stencila/convert.git
cd convert
npm install
```

Check how to contribute back to the project. All PRs are most welcome! Thank you!

### Test

Run the test suite:

```bash
npm test # or make test
```

Or, run a single test file:

```bash
node tests/convert.test.js
```

To get coverage statistics:

```bash
npm run cover # or make cover
```

Or, manually test conversion using the bin script on test cases:

```bash
./bin/stencila-convert.js tests/fixtures/paragraphs.md temp.pdf
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

####Test cases

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

 **Test case alternatives**

"Round trip" testing checks allows for testing conversions of alternatives for
input formats. For example,  Atx-style headers (tagged with `#`) in a Markdown file should be treated the same as Setext-style headers (tagged with `----` under the header text) during conversion. That is,

```
# Atx- style Header example
```

is converted into the same output as the one below:

```
Setext-style Header example
-------------
```

To make testing more[![Community](https://img.shields.io/badge/join-community-green.svg)](https://community.stenci.la)
11
[![Chat](https://badges.gitter.im/stencila/stencila.svg)](https://gitter.im/stencila/stencila) succinct we have a convention of extending test case file names with "-alternative" (dash alternative), for example, `heading.md` and `heading-setext.md`. Since the headings should be converted the same way,
`heading-setext-out.md` is compared to `heading.md`.
(Another way to think about this approach is to treat the conversion as
  standardising the input formats to pandoc Reader / Writer options.)


**Note** The above test regime tests primarily pandoc conventions for
reading from and writing to different formats, (pandoc Reader and Writer options)[https://pandoc.org/MANUAL.html#options].


####Create new test cases

You can create a new test case for a particular format by converting an existing tests case for another format. For example, to create a nested lists test case for JATS, you could use the existing test case for Markdown:

```bash
./bin/stencila-convert.js tests/fixtures/list_nested.md tests/fixtures/list_nested.jats.xml
```
