# [0.85.0](https://github.com/stencila/encoda/compare/v0.84.0...v0.85.0) (2020-02-02)


### Bug Fixes

* **Deps:** Move jsdom to dependencies and add another runtime test for HTMLElement ([d08fdbd](https://github.com/stencila/encoda/commit/d08fdbd815adfef6ad08113e22656e28ebbddcff))
* **HTTP util:** Use plain fs to fix bug in download ([28ab860](https://github.com/stencila/encoda/commit/28ab86083484a6046db448f127e2d46ab216e3c3))
* **JATS:** Break apart paragraph properly ([7da0ef9](https://github.com/stencila/encoda/commit/7da0ef9f181c0ff1dbdfefb76d0dadf0da384bb9)), closes [#403](https://github.com/stencila/encoda/issues/403)
* **JATS:** Ensure affiliations have a unique id ([c739b74](https://github.com/stencila/encoda/commit/c739b74051124c268f21c099b38b48ed20923a8c))
* **JATS:** Improve handling of math nodes. ([7caba3c](https://github.com/stencila/encoda/commit/7caba3c0e2eda20271da8807bb63f0e98e368f17)), closes [#403](https://github.com/stencila/encoda/issues/403)
* **JATS:** When encoding use article-meta ([53ceb9f](https://github.com/stencila/encoda/commit/53ceb9f3018fabf9755c84538a469cbf61f05248)), closes [#380](https://github.com/stencila/encoda/issues/380)


### Features

* **HTML:** Add encoding and decoding of Math nodes ([8120a78](https://github.com/stencila/encoda/commit/8120a78e222f170ac64042b15839d1cc7b082996))
* **HTML:** Encoding of Math in HTML using MathJax ([fc52d9d](https://github.com/stencila/encoda/commit/fc52d9dc941261f9331443c9065139ff1ad902d3))
* **Pandoc:** Add encoding and decoding of Math nodes ([a821a25](https://github.com/stencila/encoda/commit/a821a2574ae43c75103ac9016307233520864c9d))

# [0.84.0](https://github.com/stencila/encoda/compare/v0.83.2...v0.84.0) (2020-02-02)


### Bug Fixes

* **Deps:** Update to Schema 0.36.0 ([cbefbcd](https://github.com/stencila/encoda/commit/cbefbcd0003b73b316250b3f0cf7db7e03635005))
* **HTML:** Add ids to reference items so links work ([d9f4e25](https://github.com/stencila/encoda/commit/d9f4e25a08d1c242985668e5c2f093a003b8fc4e))
* **HTML:** Add missing publishedDate properties to Articles ([04eaf4b](https://github.com/stencila/encoda/commit/04eaf4b12592655a5fb2a253ae826d57cac5ae93))
* **HTML:** Do not write media files if no filePath. ([9aab5ac](https://github.com/stencila/encoda/commit/9aab5ac6a07fd9212f2c51fa678ec4495f8bc746)), closes [#381](https://github.com/stencila/encoda/issues/381)
* **HTML:** Fix itemtypes for primitives e.g boolean nodes ([0d40203](https://github.com/stencila/encoda/commit/0d402037ef598bbc6624ca37cb977f120b5ecf39))
* **HTML:** Fix organization id so that link works ([be54979](https://github.com/stencila/encoda/commit/be5497953857b3c823851a960c75d82a5a8677b6))
* **HTML:** Fix tests & decoding of elements ([ca0531e](https://github.com/stencila/encoda/commit/ca0531e75a461b8a3fba33efc1d150cb464b4e3c))
* **HTML:** Make Article description encoding conform to Schema.org ([a408ffb](https://github.com/stencila/encoda/commit/a408ffbf78b6a74d8e3778ac960f9202590f6fb4))
* **HTML:** Use the content of Cite nodes if available ([cd35e82](https://github.com/stencila/encoda/commit/cd35e826b5bf54c3e371a6dd433f4b11db68db91))
* **HTML Microdata:** Do not set undefined itemid ([dab0ba3](https://github.com/stencila/encoda/commit/dab0ba3147c9b83cc4c39eaaeec2aa617ba60725))
* **HTML Microdata:** Fix the encoding of author itemprop ([1ced19b](https://github.com/stencila/encoda/commit/1ced19b9964247f1e978c7122e68cbdd5242bc7c))
* **HTML Microdata:** Fix the Microdata test by adding article image and publisher properties. ([68ffc4c](https://github.com/stencila/encoda/commit/68ffc4c707284e362711798ca273852b76cb2e32))
* **HTML Microdata:** Limit itemprop headline to 110 characters ([efd4a73](https://github.com/stencila/encoda/commit/efd4a7344cca75a4dfb8fe6c2f8ce63378a36186))
* **HTML MIcrodata:** Do not create itemid from id ([10a5ac1](https://github.com/stencila/encoda/commit/10a5ac13a9c4dda6d6ee2f7a0411cd8bef844253))
* **JATS:** Add decoding of article-id and elocation-id ([062a4af](https://github.com/stencila/encoda/commit/062a4afa6c6ee66470d782bcd5a0d45510048e00)), closes [#395](https://github.com/stencila/encoda/issues/395)
* **JATS:** Add decoding of journal-id ([ec456bf](https://github.com/stencila/encoda/commit/ec456bf2abd94b0c08fa1af8c00530e41fa55f0d))
* **JATS:** Also decode ids in references ([5b247ab](https://github.com/stencila/encoda/commit/5b247ab7bd124d8df20042835b10f8a3b669c4a6))
* **JATS:** Decode article meta properties from front ([63a94a5](https://github.com/stencila/encoda/commit/63a94a5931df199cdaa7798e01d133060ae4bfdd))
* **JATS:** Make dateAccepted and dateReceived first class properties ([150401e](https://github.com/stencila/encoda/commit/150401e2d5ae8e99bd05e6c838d3f9cecda2d24a))
* **JATS:** Normalize rid when decoding. ([9885cfa](https://github.com/stencila/encoda/commit/9885cfa55f8c6834ed9c2363be943546798bd43e))
* **JSON-LD:** Handle PropertyValue and Date nodes properly ([2aa4503](https://github.com/stencila/encoda/commit/2aa450309b4648f94f33be92b7c4f79364ded989))
* **MicroData:** Add Schema.org Text node primitive to list of types ([2cd57ce](https://github.com/stencila/encoda/commit/2cd57cea8e551ba052bd854a42f8c727c931dc11))
* **Util:** Make sub-schemas async as well ([155a00f](https://github.com/stencila/encoda/commit/155a00f4991bfe3f89393f8bee16fecc865f0bef))
* **XML:** Use major versions URL ([a5131b0](https://github.com/stencila/encoda/commit/a5131b0cfaf170a0a65048dd0f9488ddf33ef71c))


### Features

* **HTML:** Add fallback images for Publisher Logo and Article image ([9570fa6](https://github.com/stencila/encoda/commit/9570fa6b0ba9972a1e6c39d3eecebae5bf921c3a))
* **HTML:** Add MicroData attributes to elements ([f6d49db](https://github.com/stencila/encoda/commit/f6d49db0f6d64e64e8634659e4baf40300dbee2e))
* **HTML:** Encode custom Schema attributes as data-itemprops ([c0073a6](https://github.com/stencila/encoda/commit/c0073a6ecb1693b00c70015f7740755bf480a2f4))
* **HTML:** Use a meta tag when encoding fallback publisher logo & name ([058cf91](https://github.com/stencila/encoda/commit/058cf91c5e320f196e6f29e8a9619640897666eb))
* **jats:** Decode funding to fundedBy with MonetaryGrant nodes ([eb2a8a8](https://github.com/stencila/encoda/commit/eb2a8a85257b54e5ab6752a08f4cba64a69b5637))
* **JATS:** Add decoding of datePublished ([c484269](https://github.com/stencila/encoda/commit/c4842694defe0823b73bb9e293df419f21214643))
* **JATS:** Add decoding of editors ([11045af](https://github.com/stencila/encoda/commit/11045afcd86d735fa919ff96f3666ea87a3d6b8a))
* **JATS:** Add decoding of funders ([684d234](https://github.com/stencila/encoda/commit/684d234110b15a78738fa73a5d3330dfb2bf0c9a))
* **JATS:** Add decoding of isPartOf property ([15d83b3](https://github.com/stencila/encoda/commit/15d83b31a3bc093fea97c8c3c03ab18a8abace13)), closes [#395](https://github.com/stencila/encoda/issues/395)
* **JATS:** Add decoding of keywords ([3e18dd7](https://github.com/stencila/encoda/commit/3e18dd778e6cb61bf6a1c64baab0dd343ada944b))
* **JATS:** Add decoding of licences ([d437189](https://github.com/stencila/encoda/commit/d43718941f1d029eebdf35ddbb6482e05ee74626))
* **Theme:** Add ability to pass URLs as theme argument ([1690234](https://github.com/stencila/encoda/commit/16902343111356e9b9a3a849a01455263c97b1a1)), closes [#397](https://github.com/stencila/encoda/issues/397)


### Reverts

* **StringifyContent:** Revert converting Null values to empty strings ([fbedcc6](https://github.com/stencila/encoda/commit/fbedcc6f66817ee7edd1ea3522fa5dc64fe28cb2))

## [0.83.2](https://github.com/stencila/encoda/compare/v0.83.1...v0.83.2) (2020-01-23)


### Bug Fixes

* **MD:** Don't coerce decoded MD AST, avoiding false null values ([7d15806](https://github.com/stencila/encoda/commit/7d158064581ad2aa149b260196f58e8eddec1e4b))

## [0.83.1](https://github.com/stencila/encoda/compare/v0.83.0...v0.83.1) (2020-01-22)


### Bug Fixes

* **deps:** update dependency globby to v11 ([8a5fc4d](https://github.com/stencila/encoda/commit/8a5fc4dc1dec08f76dba0c3a1b5cc131fa704ff9))
* **Deps:** Upgrade to Schema 0.35 ([0482dd9](https://github.com/stencila/encoda/commit/0482dd9eb50834063b7c749ee5aa2bcc653c285e))
* **Pandoc:** Ensure that consisent version of pandoc-citeproc used ([4cb55a5](https://github.com/stencila/encoda/commit/4cb55a5f9e5841b4dddd18973b80c5ebadfeef45))
* **Pandoc:** Upgrade to 2.9.1 ([7a6b8d8](https://github.com/stencila/encoda/commit/7a6b8d8a44c30b6b924fb182e74ff10d036ff6c6))

# [0.83.0](https://github.com/stencila/encoda/compare/v0.82.1...v0.83.0) (2020-01-15)


### Bug Fixes

* **CSL:** Add encoding of dates and isPartOf ([e8aea0c](https://github.com/stencila/encoda/commit/e8aea0c3e5f5eff4cf670af2ad6b76cbfde672c9))
* **CSL:** Test for the Date objects ([1607a98](https://github.com/stencila/encoda/commit/1607a98d6b2ec9feb0959fbc22f0990b70fbd90b))
* **DOCX:** Add citations and references handling ([faecc54](https://github.com/stencila/encoda/commit/faecc54229e316a4f1e0d23a9a86ca9f506dd0c0))
* **GDoc:** Add handling of reproducible images. ([ef63768](https://github.com/stencila/encoda/commit/ef63768011678e2b472d6b8ee17913a1c1e2dec7))
* **JATS:** Decode content of Cite nodes ([3dfb161](https://github.com/stencila/encoda/commit/3dfb1615b9615e95fb78afe9c7ed06b7ef14c110))
* **JATS:** Do not preprend hash when creating Cite target ([cfabd77](https://github.com/stencila/encoda/commit/cfabd7778d149889d87f14b06ace160a003e1af7))
* **Pandoc:** Add handling of Cite and CiteGroup nodes ([12a49a1](https://github.com/stencila/encoda/commit/12a49a1b5620f6477207ee26c416ba3467e26fdd))
* **Pandoc:** Bidirectional conversion of numbers in meta ([6c49b22](https://github.com/stencila/encoda/commit/6c49b223b7bfb5ba22d46356a2cc707a9eb8070c))
* **Pandoc:** Transform references to CSL-JSON ([9ba6d5c](https://github.com/stencila/encoda/commit/9ba6d5c0b4a68aa0fd3985ab70cb825846d4a150))
* **Puppeteer:** Disable /dev/shm usage ([c630e78](https://github.com/stencila/encoda/commit/c630e787aa51fbb488b78b405555dcefcf3c9042))
* **Util:** Log HTTP errors and return response ([d17afa8](https://github.com/stencila/encoda/commit/d17afa87d8fa7f5a2d732b82c5af836bda14786b))


### Features

* **CSL:** Add vendored styles ([ad1b55a](https://github.com/stencila/encoda/commit/ad1b55a40f39ee130d0823a115ab7b19f149418c))
* **eLife:** Automatically fetch the most recent version of article ([c0b5df5](https://github.com/stencila/encoda/commit/c0b5df5611409f14b43d1bb2cc251407cb035eb6)), closes [#368](https://github.com/stencila/encoda/issues/368)
* **Markdown:** Encode Cite nodes using Pandoc convention ([80ce013](https://github.com/stencila/encoda/commit/80ce013285a0bc5fa24696f622a22788261003eb))

## [0.81.3](https://github.com/stencila/encoda/compare/v0.81.2...v0.81.3) (2019-11-29)


### Bug Fixes

* **deps:** update dependency @stencila/schema to ^0.31.0 ([3df015a](https://github.com/stencila/encoda/commit/3df015a71555be85276d0580fe0122b382063be6))
* **deps:** update dependency keyv to v4 ([fe1a0d9](https://github.com/stencila/encoda/commit/fe1a0d907ca7626b2a5dea2074d8d62a428e9c9f))
* **deps:** update dependency mdast-util-compact to v2 ([d35d795](https://github.com/stencila/encoda/commit/d35d79547aa85210c333c558ad1f059f6983a58c))
* **Deps:** Upgrade Schema version ([b340649](https://github.com/stencila/encoda/commit/b340649488287dbaa6feb562e713069c4d61bf68))

## [0.81.2](https://github.com/stencila/encoda/compare/v0.81.1...v0.81.2) (2019-11-04)


### Bug Fixes

* **Google APIs:** Upgrade to 44.0.0 ([5dd5220](https://github.com/stencila/encoda/commit/5dd5220b08fe94ce7c4a3458c802d8006bb9519c))
* **Puppeteer:** Upgrade to 2.0.0 ([e69db90](https://github.com/stencila/encoda/commit/e69db90a08f2777ed282677596104d7ac4ee7bb3))
* **UNIST:** Update utilities to latest versions ([10772ad](https://github.com/stencila/encoda/commit/10772ada5f7da3662e1f434216deeb203242d2bd))

## [0.81.1](https://github.com/stencila/encoda/compare/v0.81.0...v0.81.1) (2019-11-04)


### Bug Fixes

* **Puppeteer:** Use pipes instead on WebSockets ([d8d60e7](https://github.com/stencila/encoda/commit/d8d60e719d3139356c5bb3352f731686f5e1f246))

# [0.81.0](https://github.com/stencila/encoda/compare/v0.80.2...v0.81.0) (2019-10-15)


### Bug Fixes

* **Dependencies:** Update thema to latest version ([ef4a82b](https://github.com/stencila/encoda/commit/ef4a82b))
* **PDF:** Bundle when generating HTML to avoid local files being created. ([9c7c27f](https://github.com/stencila/encoda/commit/9c7c27f))
* **PDF:** Embed node as XML; handle metadata ([10d11fb](https://github.com/stencila/encoda/commit/10d11fb))
* **VFile:** When writing a file, ensure that the parent directory exists ([00ff27f](https://github.com/stencila/encoda/commit/00ff27f))


### Features

* **PDF:** Make reproducible using XMP metadata ([5bb8625](https://github.com/stencila/encoda/commit/5bb8625))
* **XML:** Add XML codec ([0bba311](https://github.com/stencila/encoda/commit/0bba311))

## [0.80.2](https://github.com/stencila/encoda/compare/v0.80.1...v0.80.2) (2019-10-15)


### Bug Fixes

* Decoding/Encoding CodeChunk outputs in MD ([d5479e6](https://github.com/stencila/encoda/commit/d5479e6))
* Encoding/decoding multi-line markdown codechunk outputs ([b0fb6f6](https://github.com/stencila/encoda/commit/b0fb6f6))
* Reverted to use thematic break for MD output separation ([f8c61b3](https://github.com/stencila/encoda/commit/f8c61b3))
* **IPYNB:** Decode preformaated outputs as CodeBlocks ([3e17264](https://github.com/stencila/encoda/commit/3e17264))
* **IPYNB:** Encode a plain text CodeBlock as a stream ([40ccfe0](https://github.com/stencila/encoda/commit/40ccfe0))
* **Markdown:** Handle arrays on BlockContent differently in CodeChunk encoding ([3246e31](https://github.com/stencila/encoda/commit/3246e31))
* **ORCID:** Update to API v3.0 ([ca4c891](https://github.com/stencila/encoda/commit/ca4c891))

## [0.80.1](https://github.com/stencila/encoda/compare/v0.80.0...v0.80.1) (2019-10-02)


### Bug Fixes

* **deps:** update dependency immer to v4 ([b9c0a50](https://github.com/stencila/encoda/commit/b9c0a50))
* **deps:** update dependency remark-attr to ^0.9.0 ([b8cc1da](https://github.com/stencila/encoda/commit/b8cc1da))
* **IPYNB:** Decode notebook language. Closes [#290](https://github.com/stencila/encoda/issues/290) ([7a3aa5b](https://github.com/stencila/encoda/commit/7a3aa5b))
* **Markdown:** Handle non-block content in list items ([58250de](https://github.com/stencila/encoda/commit/58250de)), closes [#183](https://github.com/stencila/encoda/issues/183)

# [0.80.0](https://github.com/stencila/encoda/compare/v0.79.0...v0.80.0) (2019-09-30)


### Bug Fixes

* **GDoc:** Fix decoding of nested lists. Closes [#103](https://github.com/stencila/encoda/issues/103) ([e97807b](https://github.com/stencila/encoda/commit/e97807b))
* **GDoc:** Handle Title paragraph style. Closes [#288](https://github.com/stencila/encoda/issues/288) ([3e7a788](https://github.com/stencila/encoda/commit/3e7a788))
* **GDoc:** Warn instead of throwing; assertDefined func ([b588f10](https://github.com/stencila/encoda/commit/b588f10))
* **HTML:** Use a major version of Thema styles ([968b7f7](https://github.com/stencila/encoda/commit/968b7f7))


### Features

* **Coerce:** Allow for variants of property names and aliases ([977c87f](https://github.com/stencila/encoda/commit/977c87f))

# [0.79.0](https://github.com/stencila/encoda/compare/v0.78.2...v0.79.0) (2019-09-27)


### Bug Fixes

* **JSON:** Order properties when encoding ([f9a4f4c](https://github.com/stencila/encoda/commit/f9a4f4c))
* **YAML:** Order properties when encoding ([e4c0522](https://github.com/stencila/encoda/commit/e4c0522))


### Features

* **Util:** Add `orderProperties` function ([c4145e9](https://github.com/stencila/encoda/commit/c4145e9))
* **Util:** Add `transformSync` function ([c9d345b](https://github.com/stencila/encoda/commit/c9d345b))

## [0.78.2](https://github.com/stencila/encoda/compare/v0.78.1...v0.78.2) (2019-09-25)


### Bug Fixes

* **toFiles:** Do not use dataUri for filename ([26ffdc9](https://github.com/stencila/encoda/commit/26ffdc9))

## [0.78.1](https://github.com/stencila/encoda/compare/v0.78.0...v0.78.1) (2019-09-25)


### Bug Fixes

* **R Notebook:** Make rgexes more permissive; warn user if inline chunk not found ([0dfe722](https://github.com/stencila/encoda/commit/0dfe722))
* **RPNG:** Add small padding; paste new CSS into TS ([01f0d1e](https://github.com/stencila/encoda/commit/01f0d1e))
* **RPNG Style:** Update rPNG styling ([51f2f35](https://github.com/stencila/encoda/commit/51f2f35))

# [0.78.0](https://github.com/stencila/encoda/compare/v0.77.1...v0.78.0) (2019-09-20)


### Bug Fixes

* **HTML:** Encode CodeExpressions as valid inline HTML elements ([b832171](https://github.com/stencila/encoda/commit/b832171))


### Features

* **HTML:** Wrap CodeOutput in <output> tags ([b9f9a8c](https://github.com/stencila/encoda/commit/b9f9a8c))

## [0.77.1](https://github.com/stencila/encoda/compare/v0.77.0...v0.77.1) (2019-09-17)


### Bug Fixes

* Using relative paths in zip media creation ([2bacb06](https://github.com/stencila/encoda/commit/2bacb06))

# [0.77.0](https://github.com/stencila/encoda/compare/v0.76.0...v0.77.0) (2019-09-17)


### Bug Fixes

* **Zip archive:** Use name of file for archive if possible ([62a2df5](https://github.com/stencila/encoda/commit/62a2df5))


### Features

* **Zip archive:** Add option to create zip archive of outputs ([ba85041](https://github.com/stencila/encoda/commit/ba85041))

# [0.76.0](https://github.com/stencila/encoda/compare/v0.75.4...v0.76.0) (2019-09-16)


### Bug Fixes

* **HTML:** Add decodeCodeChunk function ([7de5e26](https://github.com/stencila/encoda/commit/7de5e26))
* **HTML:** Handle programmingLanguage in CodeExpression ([b9f6c69](https://github.com/stencila/encoda/commit/b9f6c69))
* **RNB:** Handle code fragments properly ([9fda258](https://github.com/stencila/encoda/commit/9fda258))
* **RNB:** Parse and coerce Rmd frontmatter ([8ef82bd](https://github.com/stencila/encoda/commit/8ef82bd))
* **RNB:** Update to new layout for `CodeChunk` custom elements ([95ccdc6](https://github.com/stencila/encoda/commit/95ccdc6))
* **XMD:** Fix and improve tests ([331e6f1](https://github.com/stencila/encoda/commit/331e6f1))


### Features

* **RNB:** Add correlation of inline code chunks to outputs in HTML ([f6b9e51](https://github.com/stencila/encoda/commit/f6b9e51))
* **RNB:** Add R Notebook codec ([f9e4b34](https://github.com/stencila/encoda/commit/f9e4b34))
* **Util:** Add html utility functions ([8a47acc](https://github.com/stencila/encoda/commit/8a47acc))

## [0.75.4](https://github.com/stencila/encoda/compare/v0.75.3...v0.75.4) (2019-09-13)


### Bug Fixes

* **Build:** Update and pin Puppeteer version ([561cae2](https://github.com/stencila/encoda/commit/561cae2))
* **Deps:**  Upgrade ciitation-js ([b156446](https://github.com/stencila/encoda/commit/b156446))

## [0.75.3](https://github.com/stencila/encoda/compare/v0.75.2...v0.75.3) (2019-09-13)


### Bug Fixes

* **Build:** Reinstate files property; add nested npmignore ([356b62e](https://github.com/stencila/encoda/commit/356b62e))

## [0.75.2](https://github.com/stencila/encoda/compare/v0.75.1...v0.75.2) (2019-09-13)


### Bug Fixes

* **MD, XMD:** Use CodeFragment instead of Code node ([ec7a12e](https://github.com/stencila/encoda/commit/ec7a12e))
* **Pandoc:** Add decoding of Plain; do not throw for others ([224790a](https://github.com/stencila/encoda/commit/224790a))
* **Pandoc:** Encode CodeChunks and CodeExpressions ([deffe37](https://github.com/stencila/encoda/commit/deffe37))
* **Pandoc:** Improve docx template ([f0bd690](https://github.com/stencila/encoda/commit/f0bd690)), closes [#62](https://github.com/stencila/encoda/issues/62)
* **Pandoc:** Improve handling of meta data ([3e8e1ae](https://github.com/stencila/encoda/commit/3e8e1ae))
* **Pandoc:** Simplify title to string if possible ([371f4dc](https://github.com/stencila/encoda/commit/371f4dc))
* **rPNG:** Fix decoding of lazily loaded rPNG files ([6f9707d](https://github.com/stencila/encoda/commit/6f9707d))
* **RPNG:** Improve styling ([62c8bee](https://github.com/stencila/encoda/commit/62c8bee))
* **RPNG:** Use a specific stylesheet for HTML fragments ([2d8cc07](https://github.com/stencila/encoda/commit/2d8cc07))

## [0.75.1](https://github.com/stencila/encoda/compare/v0.75.0...v0.75.1) (2019-09-12)


### Bug Fixes

* **HTML:** Fix encoding of name & slot attributes ([feb44f0](https://github.com/stencila/encoda/commit/feb44f0))
* **HTML:** Fix resolution of Web Components on UNPKG ([bd0d1ca](https://github.com/stencila/encoda/commit/bd0d1ca))

# [0.75.0](https://github.com/stencila/encoda/compare/v0.74.0...v0.75.0) (2019-09-11)


### Features

* **HTML:** Wrap CodeChunks in custom Web Component ([b2a31f1](https://github.com/stencila/encoda/commit/b2a31f1))

# [0.74.0](https://github.com/stencila/encoda/compare/v0.73.0...v0.74.0) (2019-09-10)


### Features

* **CLI:** Allow for multiple output files ([521e198](https://github.com/stencila/encoda/commit/521e198))

# [0.73.0](https://github.com/stencila/encoda/compare/v0.72.0...v0.73.0) (2019-09-10)


### Bug Fixes

* Stringify title as needed during decoding ([d12e8ab](https://github.com/stencila/encoda/commit/d12e8ab))
* Upgrade Schema and Thema and fix tests ([745b681](https://github.com/stencila/encoda/commit/745b681))
* **HTML:** Encode media to a sibling folder ([b79dac8](https://github.com/stencila/encoda/commit/b79dac8))
* **HTML:** Fix itemtypes and encode title & description ([3faa828](https://github.com/stencila/encoda/commit/3faa828))
* **HTML:** Improve encoding of author properties e.g affiliations ([9573dba](https://github.com/stencila/encoda/commit/9573dba))
* **JATS:** Decode figure id ([1cf817b](https://github.com/stencila/encoda/commit/1cf817b))
* **JATS:** Encode and decode article abstract ([f469763](https://github.com/stencila/encoda/commit/f469763))
* **JATS:** Improve decoding of affiliations ([15a6514](https://github.com/stencila/encoda/commit/15a6514))


### Features

* **HTML:** Encode article authors ([63c580c](https://github.com/stencila/encoda/commit/63c580c))
* **JATS:** Decode title and description as content ([b4867fd](https://github.com/stencila/encoda/commit/b4867fd))

# [0.72.0](https://github.com/stencila/encoda/compare/v0.71.3...v0.72.0) (2019-09-10)


### Bug Fixes

* **HTML, Mardown:** Gracefully handle HTML fragments that are not explicitly decoded ([b8504f6](https://github.com/stencila/encoda/commit/b8504f6))


### Features

* **MD:** Decode HTML inside Markdown using Encoda's HTML Codec ([08cf4bf](https://github.com/stencila/encoda/commit/08cf4bf))

## [0.71.3](https://github.com/stencila/encoda/compare/v0.71.2...v0.71.3) (2019-09-04)


### Bug Fixes

* **CLI:** Remove import of missing file ([ff1450b](https://github.com/stencila/encoda/commit/ff1450b))

## [0.71.2](https://github.com/stencila/encoda/compare/v0.71.1...v0.71.2) (2019-09-04)


### Bug Fixes

* **Bundle:** D not attampt to bundle media that is already a data URI ([96ce43e](https://github.com/stencila/encoda/commit/96ce43e))
* **CSL:** Remove dependence on sync-request ([8fb9d5b](https://github.com/stencila/encoda/commit/8fb9d5b)), closes [#258](https://github.com/stencila/encoda/issues/258)
* **HTML:** Fix Microdata ([718bdff](https://github.com/stencila/encoda/commit/718bdff))
* **Match:** Warn if another module missing ([415746f](https://github.com/stencila/encoda/commit/415746f))
* **Pandoc:** Fix handling of CodeFragment ([bde0d3e](https://github.com/stencila/encoda/commit/bde0d3e))
* **rPNG:** Use builtin punycode ([4bf0db1](https://github.com/stencila/encoda/commit/4bf0db1))

## [0.71.1](https://github.com/stencila/encoda/compare/v0.71.0...v0.71.1) (2019-09-02)


### Bug Fixes

* **Install:** Use exec instead of spawn ([da5f4b7](https://github.com/stencila/encoda/commit/da5f4b7))
* **Install:** Use Node module path string ([34dfa6c](https://github.com/stencila/encoda/commit/34dfa6c))
* **Install:** Use Windows compatible path ([2450b91](https://github.com/stencila/encoda/commit/2450b91))
* **Pandoc binary:** Ensure directory exists ([e7ea80d](https://github.com/stencila/encoda/commit/e7ea80d))

# [0.71.0](https://github.com/stencila/encoda/compare/v0.70.0...v0.71.0) (2019-09-02)


### Bug Fixes

* **eLife:** Remove eLife mediaTypes ([3dec3c7](https://github.com/stencila/encoda/commit/3dec3c7))
* **HTTP:** Resolve format based on header and extension name ([d9d2618](https://github.com/stencila/encoda/commit/d9d2618))
* **Match:** Fallback to the txt codec to avoid throwing error ([1dc4af8](https://github.com/stencila/encoda/commit/1dc4af8))
* **Pandoc:** Add handling of Super/Subscript nodes ([ac2874f](https://github.com/stencila/encoda/commit/ac2874f))


### Features

* **eLife:** Add `elife` codec ([4414a35](https://github.com/stencila/encoda/commit/4414a35))
* **PLoS:** Add codec for PLoS (Public Library of Science) articles ([cec91a5](https://github.com/stencila/encoda/commit/cec91a5))

# [0.70.0](https://github.com/stencila/encoda/compare/v0.69.0...v0.70.0) (2019-09-02)


### Bug Fixes

* **Gdoc:** Add handling on Subscript, Superscript and Delete nodes ([aef0380](https://github.com/stencila/encoda/commit/aef0380))
* **Log:** Avoid duplicated messages ([e4d38eb](https://github.com/stencila/encoda/commit/e4d38eb))


### Features

* **Markdown:** Add handling of Superscript and Subscript nodes ([8b859f5](https://github.com/stencila/encoda/commit/8b859f5))

# [0.69.0](https://github.com/stencila/encoda/compare/v0.68.0...v0.69.0) (2019-09-02)


### Features

* Add output of CodeExpressions to MD encoding. Close [#225](https://github.com/stencila/encoda/issues/225) ([ae259af](https://github.com/stencila/encoda/commit/ae259af))

# [0.68.0](https://github.com/stencila/encoda/compare/v0.67.2...v0.68.0) (2019-08-30)


### Features

* Remove statically coded Thema theme names close [#245](https://github.com/stencila/encoda/issues/245) ([d71a19c](https://github.com/stencila/encoda/commit/d71a19c))

## [0.67.2](https://github.com/stencila/encoda/compare/v0.67.1...v0.67.2) (2019-08-29)


### Bug Fixes

* **deps:** update remark monorepo ([0f0d423](https://github.com/stencila/encoda/commit/0f0d423))

## [0.67.1](https://github.com/stencila/encoda/compare/v0.67.0...v0.67.1) (2019-08-28)


### Bug Fixes

* **HTML:** Change CiteGroup from ol to span, allows nesting in Paragraph ([2a72565](https://github.com/stencila/encoda/commit/2a72565))

# [0.67.0](https://github.com/stencila/encoda/compare/v0.66.0...v0.67.0) (2019-08-28)


### Bug Fixes

* Use programmingLanguage instead of language ([ddc0c0e](https://github.com/stencila/encoda/commit/ddc0c0e))
* **Coerce:** Await as needed and better validation messages ([f065e5f](https://github.com/stencila/encoda/commit/f065e5f))
* **Coerce:** Coerce an array to a scalar if necessary ([d1cf879](https://github.com/stencila/encoda/commit/d1cf879))
* **CSI:** Use JSON.stringify for encoding of objects ([da437c7](https://github.com/stencila/encoda/commit/da437c7))
* **JATS:** Fixes for changes in schema ([fca663a](https://github.com/stencila/encoda/commit/fca663a))
* **JSON-LD:** Add encoding; transform decoded node ([bdd8763](https://github.com/stencila/encoda/commit/bdd8763))
* **JSON-LD:** Use the Stencila [@context](https://github.com/context) when compacting ([51dbc50](https://github.com/stencila/encoda/commit/51dbc50))
* **ORCID:** Use JSON-LD codec to decode response ([1a6fe3c](https://github.com/stencila/encoda/commit/1a6fe3c))
* **Person:** Update to use new `jsonld` codec ([6b8fdcc](https://github.com/stencila/encoda/commit/6b8fdcc))


### Features

* **Coerce:** Add defaults for missing properties ([e921f41](https://github.com/stencila/encoda/commit/e921f41))
* **Coerce:** Log warning about data loss during coercion ([eb8bb6d](https://github.com/stencila/encoda/commit/eb8bb6d))
* **CSI:** Add `csi` codec for handling keywords etc ([f38e676](https://github.com/stencila/encoda/commit/f38e676))
* **Date:** Add date codec and upgrade schema version ([3a8d3b7](https://github.com/stencila/encoda/commit/3a8d3b7))
* **JSON-LD:** Add `jsonld` codec ([efb00bd](https://github.com/stencila/encoda/commit/efb00bd)), closes [#207](https://github.com/stencila/encoda/issues/207)
* **JSON-LD:** Implement caching document loader ([fbe6156](https://github.com/stencila/encoda/commit/fbe6156))

# [0.66.0](https://github.com/stencila/encoda/compare/v0.65.1...v0.66.0) (2019-08-22)


### Bug Fixes

* **Tests:** Fix test failures due to false TypeScript errors ([a9fe1f8](https://github.com/stencila/encoda/commit/a9fe1f8))


### Features

* **HTML:** Add support for Cite, CiteGroup, Figure, Collection nodes ([e9dd3ed](https://github.com/stencila/encoda/commit/e9dd3ed))
* **HTML:** Handle more props on Article/Person/Org/Ref/CreativeWork ([32e0d96](https://github.com/stencila/encoda/commit/32e0d96))

## [0.65.1](https://github.com/stencila/encoda/compare/v0.65.0...v0.65.1) (2019-08-21)


### Bug Fixes

* **CSV:** Use papaparse for csv codec ([ae52615](https://github.com/stencila/encoda/commit/ae52615))

# [0.65.0](https://github.com/stencila/encoda/compare/v0.64.0...v0.65.0) (2019-08-20)


### Bug Fixes

* **ORCID:** Temporary fix awaiting jsonld codec ([de7164d](https://github.com/stencila/encoda/commit/de7164d))


### Features

* **Person:** Detect and use ORCID ([2754e1f](https://github.com/stencila/encoda/commit/2754e1f))

# [0.64.0](https://github.com/stencila/encoda/compare/v0.63.0...v0.64.0) (2019-08-18)


### Bug Fixes

* **IPYNB:** Handle decoding of string and object authors ([73f0dcf](https://github.com/stencila/encoda/commit/73f0dcf))


### Features

* **IPYNB:** Add decoding of notebook authors ([8933414](https://github.com/stencila/encoda/commit/8933414))

# [0.63.0](https://github.com/stencila/encoda/compare/v0.62.7...v0.63.0) (2019-08-18)


### Features

* **IPYNB:** Validate notebooks before decoding and after encoding ([3d3daa3](https://github.com/stencila/encoda/commit/3d3daa3))

## [0.62.7](https://github.com/stencila/encoda/compare/v0.62.6...v0.62.7) (2019-08-14)


### Bug Fixes

* **CLI:** Adapt to change in validate function ([21d2e6b](https://github.com/stencila/encoda/commit/21d2e6b))
* **Coerce:** Do not use the useDefaults Ajv option ([e2dc38e](https://github.com/stencila/encoda/commit/e2dc38e)), closes [#190](https://github.com/stencila/encoda/issues/190)

## [0.62.6](https://github.com/stencila/encoda/compare/v0.62.5...v0.62.6) (2019-08-13)


### Bug Fixes

* **CLI:** Do not have a default for the `to` arg ([3b2f702](https://github.com/stencila/encoda/commit/3b2f702))
* **Markdown:** Fallback to returning emoty string ([a041606](https://github.com/stencila/encoda/commit/a041606))
* **Markdown:** Log warnings instead of thowing errors ([a99e7bf](https://github.com/stencila/encoda/commit/a99e7bf))

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
