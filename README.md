## `stencila/convert` : Stencila converters

[![experimental](https://img.shields.io/badge/stability-experimental-orange.svg)](http://github.com/badges/stability-badges)
[![Community](https://img.shields.io/badge/join-community-green.svg)](https://community.stenci.la)
[![Chat](https://badges.gitter.im/stencila/stencila.svg)](https://gitter.im/stencila/stencila)

Convert Stencila Documents, Sheets and Funcitons to other formats.

### Status

The following table lists the status of converters that have been developed, are in development, or are being considered for development. We'll be developing converters based on demand from users. So if you'd like to see a converter for your favorite format, +1 the relevant issue, or create an issue if there isn't one yet. Or, send us a pull request!

Format | Issue | Status
------ | :---: | :----:
**Documents** |
Markdown |
RMarkdown |
Latex |
JupyterNotebook |
HTML |
PDF |
**Sheets** |
CSV |
[Tabular Data Package](https://specs.frictionlessdata.io/tabular-data-package/) |
[CSVY](http://csvy.org/) |
Excel |
Open Document Spreadsheet |
**Functions** |
JsDoc | [#1](https://github.com/stencila/convert/issues/1) | ![alpha](https://img.shields.io/badge/status-alpha-red.svg)

### Development

1. Clone the repo

```bash
git clone https://github.com/stencila/convert.git
```

2. Install dependencies

```bash
npm install
```

3. Test

```bash
npm test
```

or use `node make test:browser -w` and open `test/index.html` in your browser.  


4. Build

```bash
node make
```
