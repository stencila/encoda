## [0.62.5](https://github.com/stencila/encoda/compare/v0.62.4...v0.62.5) (2019-08-13)


### Bug Fixes

* **deps:** update dependency xlsx to ^0.15.0 ([fa34e2e](https://github.com/stencila/encoda/commit/fa34e2e))

## [0.62.4](https://github.com/stencila/encoda/compare/v0.62.3...v0.62.4) (2019-08-12)


### Bug Fixes

* **DOI:** Fix encoding failure error message ([7a97230](https://github.com/stencila/encoda/commit/7a97230))

## [0.62.3](https://github.com/stencila/encoda/compare/v0.62.2...v0.62.3) (2019-08-09)


### Bug Fixes

* **Coerce:** Remove additional properties, coerce object to array ([6d5e0ef](https://github.com/stencila/encoda/commit/6d5e0ef))

## [0.62.2](https://github.com/stencila/encoda/compare/v0.62.1...v0.62.2) (2019-08-09)


### Bug Fixes

* Fix JATS linting and tests ([1b68639](https://github.com/stencila/encoda/commit/1b68639))

## [0.62.1](https://github.com/stencila/encoda/compare/v0.62.0...v0.62.1) (2019-08-07)


### Bug Fixes

* **Pandoc:** Fix encoding of Table nodes ([e7f882b](https://github.com/stencila/encoda/commit/e7f882b))

# [0.62.0](https://github.com/stencila/encoda/compare/v0.61.2...v0.62.0) (2019-08-06)


### Bug Fixes

* **Coerce:** Do not remove additional properties ([12adaf6](https://github.com/stencila/encoda/commit/12adaf6))
* **Coerce:** Log a warning if the codec is not found ([d523f42](https://github.com/stencila/encoda/commit/d523f42))
* **Deps:** Update @stencila/schema to 0.24.0 ([fd2e9ad](https://github.com/stencila/encoda/commit/fd2e9ad))


### Features

* **CLI:** Add coerce and validate functions to CLI ([fb62478](https://github.com/stencila/encoda/commit/fb62478))

## [0.61.2](https://github.com/stencila/encoda/compare/v0.61.1...v0.61.2) (2019-08-02)


### Bug Fixes

* **deps:** update dependency @stencila/schema to ^0.23.0 ([d8ac21a](https://github.com/stencila/encoda/commit/d8ac21a))
* **Deps:** Upgrade to schema@0.23.0 ([c8b81da](https://github.com/stencila/encoda/commit/c8b81da))
* **Package:** Use full file name ([de80d1e](https://github.com/stencila/encoda/commit/de80d1e)), closes [/ci.appveyor.com/project/nokome/convert/builds/26418504#L34](https://github.com//ci.appveyor.com/project/nokome/convert/builds/26418504/issues/L34)

## [0.61.1](https://github.com/stencila/encoda/compare/v0.61.0...v0.61.1) (2019-08-02)


### Bug Fixes

* **Package:** Fix Pandoc DOCX template path ([e552476](https://github.com/stencila/encoda/commit/e552476))

# [0.61.0](https://github.com/stencila/encoda/compare/v0.60.4...v0.61.0) (2019-07-31)


### Bug Fixes

* **DAR:** Use jats-pandoc codec for DAR ([a31a6ec](https://github.com/stencila/encoda/commit/a31a6ec))
* **HTML:** Add handling of sup/sub-scripts ([3239475](https://github.com/stencila/encoda/commit/3239475))
* **JATS:** Add encoding for more node types ([6966088](https://github.com/stencila/encoda/commit/6966088))
* **JATS:** Use utility functions from schema ([f0e5fe0](https://github.com/stencila/encoda/commit/f0e5fe0))
* **XML:** Fix encoding of text nodes ([de05f7c](https://github.com/stencila/encoda/commit/de05f7c))


### Features

* **HTML:** Use Microdata to semantically encode article citations. ([a19fd84](https://github.com/stencila/encoda/commit/a19fd84))
* **JATS:** Add new Typescript-based JATS codec ([256eaf5](https://github.com/stencila/encoda/commit/256eaf5))

## [0.60.4](https://github.com/stencila/encoda/compare/v0.60.3...v0.60.4) (2019-07-29)


### Bug Fixes

* **DOCX:** Fix path to reference doc ([22649f6](https://github.com/stencila/encoda/commit/22649f6))

## [0.60.3](https://github.com/stencila/encoda/compare/v0.60.2...v0.60.3) (2019-07-26)


### Bug Fixes

* **HTML:** HTML string escaping ([bb83cac](https://github.com/stencila/encoda/commit/bb83cac))

## [0.60.2](https://github.com/stencila/encoda/compare/v0.60.1...v0.60.2) (2019-07-25)


### Bug Fixes

* **Markdown:** Sanitize white spaces in tables close [#179](https://github.com/stencila/encoda/issues/179) ([6f7b140](https://github.com/stencila/encoda/commit/6f7b140))

## [0.60.1](https://github.com/stencila/encoda/compare/v0.60.0...v0.60.1) (2019-07-25)


### Bug Fixes

* **Thema:** Update Thema version ([bc99c2a](https://github.com/stencila/encoda/commit/bc99c2a))

# [0.60.0](https://github.com/stencila/encoda/compare/v0.59.2...v0.60.0) (2019-07-25)


### Bug Fixes

* **Coerce:** Change to `codec` keyword to match change in Schema ([b496761](https://github.com/stencila/encoda/commit/b496761))
* **Coerce:** Do not use removed aliases.json ([640e48e](https://github.com/stencila/encoda/commit/640e48e))
* **Dependency:** Update schema version ([d45c09d](https://github.com/stencila/encoda/commit/d45c09d))
* **Link:** Use title property for link nodes ([8464915](https://github.com/stencila/encoda/commit/8464915))
* **Markdown, HTML:** Fix include node handling ([1c147b7](https://github.com/stencila/encoda/commit/1c147b7))
* **Package:** Fix distribution of Pandoc templates ([945b921](https://github.com/stencila/encoda/commit/945b921))
* **Util:** Fix validation and coercion for new Types interface ([429870d](https://github.com/stencila/encoda/commit/429870d))
* **Validation:** New location for JSON Schema files ([1b6cd50](https://github.com/stencila/encoda/commit/1b6cd50))


### Features

* **TypeGuards:** Remove type guards, instead import them from Schema ([0259410](https://github.com/stencila/encoda/commit/0259410))

## [0.59.2](https://github.com/stencila/encoda/compare/v0.59.1...v0.59.2) (2019-07-24)


### Bug Fixes

* **CI:** Move ESLint config to own file to fix Travis issues ([05a0c6c](https://github.com/stencila/encoda/commit/05a0c6c))

## [0.59.1](https://github.com/stencila/encoda/compare/v0.59.0...v0.59.1) (2019-07-19)


### Bug Fixes

* **HTML:** Move slugger reset to the right place ([a845948](https://github.com/stencila/encoda/commit/a845948))
* **HTTP utility:** Use synchronous cache ([bbad587](https://github.com/stencila/encoda/commit/bbad587))

# [0.59.0](https://github.com/stencila/encoda/compare/v0.58.0...v0.59.0) (2019-07-18)


### Bug Fixes

* **Package:** Copy Pandoc templates to the correct place. ([a9f133d](https://github.com/stencila/encoda/commit/a9f133d))


### Features

* **Dependecies:** Upgrade @stencila/schema ([93e68cc](https://github.com/stencila/encoda/commit/93e68cc))

# [0.58.0](https://github.com/stencila/encoda/compare/v0.57.0...v0.58.0) (2019-07-18)


### Bug Fixes

* **CLI:** Pass through directory when encoding ([3a0403a](https://github.com/stencila/encoda/commit/3a0403a))


### Features

* **Include:** Add initial version of Include node ([01f32f4](https://github.com/stencila/encoda/commit/01f32f4))

# [0.57.0](https://github.com/stencila/encoda/compare/v0.56.0...v0.57.0) (2019-07-18)


### Bug Fixes

* **Pandoc:** Better handling of non-Article nodes at top level ([f9c1b30](https://github.com/stencila/encoda/commit/f9c1b30))
* **Process:** Always dump to code blocks with isStandalone false ([3fd43a1](https://github.com/stencila/encoda/commit/3fd43a1))


### Features

* **CLI:** Add process command to CLI ([17b1438](https://github.com/stencila/encoda/commit/17b1438))
* **Pandoc:** Prettify Pandoc JSON output ([03eb44b](https://github.com/stencila/encoda/commit/03eb44b))

# [0.56.0](https://github.com/stencila/encoda/compare/v0.55.1...v0.56.0) (2019-07-17)


### Features

* **Processing:** Add coerce keyword and default to it for import etc ([e61756e](https://github.com/stencila/encoda/commit/e61756e))

## [0.55.1](https://github.com/stencila/encoda/compare/v0.55.0...v0.55.1) (2019-07-17)


### Bug Fixes

* **Dependencies:** Move trash to prod dependencies ([90b77c0](https://github.com/stencila/encoda/commit/90b77c0))

# [0.54.0](https://github.com/stencila/encoda/compare/v0.53.7...v0.54.0) (2019-07-09)


### Bug Fixes

* **Cache:** Await ensure directory ([af99c3a](https://github.com/stencila/encoda/commit/af99c3a))
* **DAR:** Improve naming of encoded files ([133dcb2](https://github.com/stencila/encoda/commit/133dcb2))
* **HTML:** Include meta tags to optimize output for mobile and IE ([6277163](https://github.com/stencila/encoda/commit/6277163))


### Features

* **HTTP:** Add caching for HTTP requests ([1c9f645](https://github.com/stencila/encoda/commit/1c9f645))
* **HTTP:** Add http utility module ([06805f2](https://github.com/stencila/encoda/commit/06805f2))
* **Pandoc:** Upgrade to Pandoc 2.7.3 ([d56a752](https://github.com/stencila/encoda/commit/d56a752))


### Performance Improvements

* **CLI:** Remove unecessary imports to improve startup time ([9027c27](https://github.com/stencila/encoda/commit/9027c27))

## [0.53.7](https://github.com/stencila/encoda/compare/v0.53.6...v0.53.7) (2019-07-05)


### Bug Fixes

* **HTML:** Add id attributes to headings when encoding ([f921182](https://github.com/stencila/encoda/commit/f921182))
* **MD:** Handle link and image references ([ad3cdfe](https://github.com/stencila/encoda/commit/ad3cdfe)), closes [#156](https://github.com/stencila/encoda/issues/156)

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
