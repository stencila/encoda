# [0.53.0](https://github.com/stencila/encoda/compare/v0.52.1...v0.53.0) (2019-06-29)


### Bug Fixes

* **DIR:** Fix handling of paths on Windows ([5cb4d41](https://github.com/stencila/encoda/commit/5cb4d41)), closes [/ci.appveyor.com/project/nokome/convert/builds/25637662#L147](https://github.com//ci.appveyor.com/project/nokome/convert/builds/25637662/issues/L147)


### Features

* **DIR:** Add `dir` codec ([ce2f2aa](https://github.com/stencila/encoda/commit/ce2f2aa))
* **DIR:** Add classification of main node in each collection ([43153f3](https://github.com/stencila/encoda/commit/43153f3))
* **DIR:** Add encoding to a directory ([6ab7c7f](https://github.com/stencila/encoda/commit/6ab7c7f))

## [0.52.1](https://github.com/stencila/encoda/compare/v0.52.0...v0.52.1) (2019-06-29)


### Bug Fixes

* **package:** update unified to version 8.0.0 ([bfbdcba](https://github.com/stencila/encoda/commit/bfbdcba))

# [0.52.0](https://github.com/stencila/encoda/compare/v0.51.2...v0.52.0) (2019-06-27)


### Bug Fixes

* **DAR:** Pass through encoding options when encoding document ([994ecf0](https://github.com/stencila/encoda/commit/994ecf0))


### Features

* **DAR:** Add inital implementation of DAR encoding ([eac3ad4](https://github.com/stencila/encoda/commit/eac3ad4))

## [0.51.2](https://github.com/stencila/encoda/compare/v0.51.1...v0.51.2) (2019-06-27)


### Bug Fixes

* **Pandoc:** Add CSS styles to unsupported nodes rendered as rPNGs ([c5bb32c](https://github.com/stencila/encoda/commit/c5bb32c))

## [0.51.1](https://github.com/stencila/encoda/compare/v0.51.0...v0.51.1) (2019-06-26)


### Bug Fixes

* **Build:** Fix build issues ([f2079e0](https://github.com/stencila/encoda/commit/f2079e0))
* **Demo Magic:** Add "dmagic" extension name ([f9e0d26](https://github.com/stencila/encoda/commit/f9e0d26))
* **DOCX:** Fix incorrect Pandoc template path ([e089371](https://github.com/stencila/encoda/commit/e089371))
* **Jest:** Fix Jest test matching RegEx ([5785e79](https://github.com/stencila/encoda/commit/5785e79))
* **Jest:** Fix watchPathIgnorePatterns configuration ([29f6008](https://github.com/stencila/encoda/commit/29f6008))
* **Jest:** Make sure we do not run tests in dist folder ([46422d0](https://github.com/stencila/encoda/commit/46422d0))


### Performance Improvements

* **CLI:** Improve startup time by using dynamic module loading ([9d94798](https://github.com/stencila/encoda/commit/9d94798))

# [0.51.0](https://github.com/stencila/encoda/compare/v0.50.4...v0.51.0) (2019-06-21)


### Bug Fixes

* **Docs:** Refactor code to work with TypeDoc’s version of TypeScript ([ea9b299](https://github.com/stencila/encoda/commit/ea9b299))
* **List:** Fix encoding of nested list items ([4ad1796](https://github.com/stencila/encoda/commit/4ad1796))


### Features

* **HTML:** Add ability to decode Nested Lists ([8c76eca](https://github.com/stencila/encoda/commit/8c76eca))

## [0.50.4](https://github.com/stencila/encoda/compare/v0.50.3...v0.50.4) (2019-06-20)


### Bug Fixes

* **HTML, RPNG, PDF:** Adds `isBundle` encoding option ([1c67ed1](https://github.com/stencila/encoda/commit/1c67ed1)), closes [#118](https://github.com/stencila/encoda/issues/118) [#119](https://github.com/stencila/encoda/issues/119)

## [0.50.3](https://github.com/stencila/encoda/compare/v0.50.2...v0.50.3) (2019-06-20)


### Bug Fixes

* **CSV:** Insert null values for empty Datatable cells ([ffad31c](https://github.com/stencila/encoda/commit/ffad31c))

## [0.50.2](https://github.com/stencila/encoda/compare/v0.50.1...v0.50.2) (2019-06-19)


### Bug Fixes

* **Pandoc:** Ignore EPIPE errors ([ebfb247](https://github.com/stencila/encoda/commit/ebfb247))
* **Pandoc:** Update EPIPE error handling logic ([d6ee037](https://github.com/stencila/encoda/commit/d6ee037))
* **Puppeteer:** Acquire lock when shutting down browser ([6545d1a](https://github.com/stencila/encoda/commit/6545d1a))
* **Puppeteer:** Ensure single, lazily launched browser instance ([e7140e9](https://github.com/stencila/encoda/commit/e7140e9)), closes [#100](https://github.com/stencila/encoda/issues/100)
* **XMarkdown:** Fix decoding and encoding of CodeExpr and CodeChunks ([220dfbe](https://github.com/stencila/encoda/commit/220dfbe))

## [0.50.1](https://github.com/stencila/encoda/compare/v0.50.0...v0.50.1) (2019-06-18)


### Bug Fixes

* **Package:** Upgrade @stencila/logga ([3e3ee77](https://github.com/stencila/encoda/commit/3e3ee77))
