## [0.53.6](https://github.com/stencila/encoda/compare/v0.53.5...v0.53.6) (2019-07-05)


### Bug Fixes

* **HTML:** Do not always bundle CSS and JS ([59f6ad8](https://github.com/stencila/encoda/commit/59f6ad8)), closes [#151](https://github.com/stencila/encoda/issues/151)
* **HTML:** Pass options through to generateHtmlElement ([b2eaca2](https://github.com/stencila/encoda/commit/b2eaca2))

## [0.53.5](https://github.com/stencila/encoda/compare/v0.53.4...v0.53.5) (2019-07-04)


### Bug Fixes

* **CLI:** Avoid duplicate log messages ([b232671](https://github.com/stencila/encoda/commit/b232671))
* **DIR:** Add sniff function to allow matching of directories ([6daf30a](https://github.com/stencila/encoda/commit/6daf30a))
* **DIR:** Fix depth and correct tests ([fa72d7b](https://github.com/stencila/encoda/commit/fa72d7b))
* **DIR:** Pass encoding options to write ([f544f82](https://github.com/stencila/encoda/commit/f544f82))
* **XMD:** Improve regexes for code chunks ([7e2b0c2](https://github.com/stencila/encoda/commit/7e2b0c2))

## [0.53.4](https://github.com/stencila/encoda/compare/v0.53.3...v0.53.4) (2019-07-02)


### Bug Fixes

* **Util:** Make validate etc function async ([89d4485](https://github.com/stencila/encoda/commit/89d4485))
* **Util:** Use Ajv async schema compilation ([4bad4af](https://github.com/stencila/encoda/commit/4bad4af))

## [0.53.3](https://github.com/stencila/encoda/compare/v0.53.2...v0.53.3) (2019-07-02)


### Bug Fixes

* **DOCX:** Removes the page break before Heading1 nodes ([aa08f74](https://github.com/stencila/encoda/commit/aa08f74)), closes [#92](https://github.com/stencila/encoda/issues/92)

## [0.53.2](https://github.com/stencila/encoda/compare/v0.53.1...v0.53.2) (2019-07-02)


### Bug Fixes

* **IPYNB:** Filter out matplotlib repr string outputs ([1fb37db](https://github.com/stencila/encoda/commit/1fb37db)), closes [#146](https://github.com/stencila/encoda/issues/146)
* **IPYNB:** Improve handling of nbformat3 outputs ([8d6f3ee](https://github.com/stencila/encoda/commit/8d6f3ee))

## [0.53.1](https://github.com/stencila/encoda/compare/v0.53.0...v0.53.1) (2019-07-02)


### Bug Fixes

* **Match:** Do not log a warning when no module found ([6752abd](https://github.com/stencila/encoda/commit/6752abd)), closes [#141](https://github.com/stencila/encoda/issues/141)

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
