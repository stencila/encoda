## `stencila/convert` : Stencila converters

![Experimental](https://img.shields.io/badge/stability-experimental-orange.svg)
[![NPM](http://img.shields.io/npm/v/stencila-convert.svg?style=flat)](https://www.npmjs.com/package/stencila-convert)
[![Build status](https://travis-ci.org/stencila/convert.svg?branch=master)](https://travis-ci.org/stencila/convert)
[![Build status](https://ci.appveyor.com/api/projects/status/f1hx694pxm0fyqni?svg=true)](https://ci.appveyor.com/project/nokome/convert)
[![Code coverage](https://codecov.io/gh/stencila/convert/branch/master/graph/badge.svg)](https://codecov.io/gh/stencila/convert)
[![Dependency status](https://david-dm.org/stencila/convert.svg)](https://david-dm.org/stencila/convert)
[![Community](https://img.shields.io/badge/join-community-green.svg)](https://community.stenci.la)
[![Chat](https://badges.gitter.im/stencila/stencila.svg)](https://gitter.im/stencila/stencila)

Convert Stencila Documents, Sheets and Funcitons to other formats.

### Use

This package is integrated into the Stencila command line tool [`stencila/cli`](https://github.com/stencila/cli). That's the most convenient way to use converters e.g.

```bash
stencila convert document.md document.rdc
```

But you can also use this package directly e.g.

```bash
npm install stencila-convert -g
stencila-convert document.md document.rdc
```

### Status

The following table lists the status of converters that have been developed, are in development, or are being considered for development. We'll be developing converters based on demand from users. So if you'd like to see a converter for your favorite format, +1 the relevant issue, or create an issue if there isn't one yet. Or, send us a pull request!

Format | Import | Export
------ | :----: | :----:
**Documents** | |
Markdown | |
RMarkdown | |
Latex | |
JupyterNotebook | |
HTML | |
PDF | |
**Sheets** | |
CSV |![alpha](https://img.shields.io/badge/status-alpha-red.svg)|![alpha](https://img.shields.io/badge/status-alpha-red.svg)
[CSVY](http://csvy.org/) | |
[Tabular Data Package](https://specs.frictionlessdata.io/tabular-data-package/) | |
Excel `.xlsx`|![alpha](https://img.shields.io/badge/status-alpha-red.svg)|![alpha](https://img.shields.io/badge/status-alpha-red.svg)
Open Document Spreadsheet `.ods`|![alpha](https://img.shields.io/badge/status-alpha-red.svg)|![alpha](https://img.shields.io/badge/status-alpha-red.svg)
**Functions** | |
JsDoc | ![alpha](https://img.shields.io/badge/status-alpha-red.svg) |

### Develop

1. Clone the repo

    ```bash
    git clone https://github.com/stencila/convert.git
    ```

2. Install dependencies

    ```bash
    npm install
    ```

#### Testing

Run the test suite:

```bash
npm test # or make test
```

Or, run a single test file:

Run the test suite:

```bash
npm run test-one -- tests/function/FunctionJsDocConverter.test.js
```

To get coverage statistics:

```bash
npm run cover # or make cover
```

Or, manually test conversion using the bin script:

```bash
bin/stencila-convert.js tests/document/fixtures/paragraph/md/paragraph.md temp.pdf
```
