## [0.117.2](https://github.com/stencila/encoda/compare/v0.117.1...v0.117.2) (2021-06-22)


### Bug Fixes

* **CLI:** Add shebang so that bin command works ([afc2bf2](https://github.com/stencila/encoda/commit/afc2bf2e89f529e0ffc95c997fab5c2bb4311cd1))
* **dependencies:** update dependency js-beautify to ^1.14.0 ([8a16f3a](https://github.com/stencila/encoda/commit/8a16f3a3260c5b1216705e583253902c4b263e4f))

## [0.117.1](https://github.com/stencila/encoda/compare/v0.117.0...v0.117.1) (2021-06-21)


### Bug Fixes

* Account for TableCell content potentially being undefined ([758b6ea](https://github.com/stencila/encoda/commit/758b6ea5631b8bf87f0e1e4479b6118b196b66db))
* Use `MediaObject` `mediaType` rather than `format`; fix for content types ([186096e](https://github.com/stencila/encoda/commit/186096ef0328697db53ce3f7db22eb12c52cb210))
* **Build:** Avoid src in dist folder ([0105b6a](https://github.com/stencila/encoda/commit/0105b6ad7ba62871f36b8e8147b7b37459c87952)), closes [/github.com/stencila/encoda/pull/957#issue-671741247](https://github.com//github.com/stencila/encoda/pull/957/issues/issue-671741247)
* **Build:** Do not use compression withing binary ([c0517d4](https://github.com/stencila/encoda/commit/c0517d408f07db9cc62f79310eaaf5342da14649))
* **Build:** Include dist js in scripts ([d984c93](https://github.com/stencila/encoda/commit/d984c9319174d9fe84f14276d38a405498806e12))
* **Coercion:** Default to no coercion ([224a378](https://github.com/stencila/encoda/commit/224a37803c37799e56ea60a50d5a4c76663b638f)), closes [#902](https://github.com/stencila/encoda/issues/902)
* **dependencies:** update dependency @stencila/thema to ^2.24.2 ([b4bf10b](https://github.com/stencila/encoda/commit/b4bf10ba2e84845b3342cb81b0e8ba0518248371))
* **dependencies:** update dependency globby to ^11.0.4 ([773a2f9](https://github.com/stencila/encoda/commit/773a2f91120f5a59172fdea1a0c102a610dfd51f))
* **dependencies:** update dependency papaparse to ^5.3.1 ([99ab93f](https://github.com/stencila/encoda/commit/99ab93fb7736e7ba67cfa96998e0e38c549af28e))
* **dependencies:** update dependency puppeteer to v10 ([de23f29](https://github.com/stencila/encoda/commit/de23f290bc65b91d40fcaea90f174fe049651357))
* **dependencies:** update dependency trash to ^7.2.0 ([dda2194](https://github.com/stencila/encoda/commit/dda219408e85cb39e64be84e66cd10c5c8359efd))
* **Deps:** Add Schema to peerDependencies and update type guards ([fbd0214](https://github.com/stencila/encoda/commit/fbd021420bf2d149e80885aa09ac75f91ce6a798))
* **Deps:** Use Schema 1.9.0 ([13a347a](https://github.com/stencila/encoda/commit/13a347af525d1bfb02d4d5046d8421cecd13abad))
* **GDoc:** Use isA instead of isParagraph ([ffc83fc](https://github.com/stencila/encoda/commit/ffc83fc9e0d034b3ef4d8351dbe845a310ec6bf1))
* **HTML & JATS:** Use Mark.type instead of type map ([712d2f5](https://github.com/stencila/encoda/commit/712d2f5bebeeb941e5926a79253e67e43ae45bff))
* **Manifest:** Fix issue with the way that the plugin manifest was generated ([017aad3](https://github.com/stencila/encoda/commit/017aad3af5dee6671e6ef64c8ac93241d6a1809d))
* **Typings:** Fixes for changes in typing of CreativeWork content ([1a0fe89](https://github.com/stencila/encoda/commit/1a0fe89c8f7a1ed6f7ecd6d1dadf453fb5c5e379))

# [0.117.0](https://github.com/stencila/encoda/compare/v0.116.1...v0.117.0) (2021-05-28)


### Bug Fixes

* More fixes for changes in types ([e4eb1d7](https://github.com/stencila/encoda/commit/e4eb1d7bc17580e76d26c9a934333eea874b17a5))
* Upgrade to latest Schema version ([1d9f7c3](https://github.com/stencila/encoda/commit/1d9f7c3dc22957a42e685811432ed45dbbf8e9d6))
* **dependencies:** update dependency @stencila/schema to ^1.7.1 ([5aa0c3c](https://github.com/stencila/encoda/commit/5aa0c3caa7d97c51afe26388394eb35400c6f980))
* **dependencies:** update dependency citation-js to ^0.5.1 ([6c6da39](https://github.com/stencila/encoda/commit/6c6da39333817a9da9f4442a77aa5435673d861e))
* **dependencies:** update dependency jsdom to ^16.6.0 ([edbbdf3](https://github.com/stencila/encoda/commit/edbbdf323aa45e199046d37c7f52312322b85e2f))
* **dependencies:** update dependency xlsx to ^0.17.0 ([a5a59ae](https://github.com/stencila/encoda/commit/a5a59ae84d91f2ce3d4f65665ae26260b3b6d127))
* **IPYNB:** Do not validate notebooks ([c77e44a](https://github.com/stencila/encoda/commit/c77e44a367da43879fefe5616a6af3554d6864b4))
* **Reshape:** Apply rules to any inline content, not just paragraphs ([e805b60](https://github.com/stencila/encoda/commit/e805b608a7b188e6031054a2823b13d479f007af))


### Features

* **Plugin:** Add codemeta.json and setup to act as a plugin ([ce34372](https://github.com/stencila/encoda/commit/ce34372095b0413c0cbf3043fab3b96feeb61cd3))

## [0.116.1](https://github.com/stencila/encoda/compare/v0.116.0...v0.116.1) (2021-05-10)


### Bug Fixes

* **dependencies:** update dependency async-lock to ^1.3.0 ([dea118f](https://github.com/stencila/encoda/commit/dea118fb184eb149a9817a377264d932771e6aaa))
* **Deps:** Update various dependencies ([ab1f903](https://github.com/stencila/encoda/commit/ab1f903d40da01c5d311554a598bf3dc7eaf4d3f))

# [0.116.0](https://github.com/stencila/encoda/compare/v0.115.4...v0.116.0) (2021-04-27)


### Features

* **Demo Magic:** Add noexec option and improve spacing after code ([45ac2f3](https://github.com/stencila/encoda/commit/45ac2f3db129176b44487aef778881159214c1d0))

## [0.115.4](https://github.com/stencila/encoda/compare/v0.115.3...v0.115.4) (2021-04-27)


### Bug Fixes

* **Demo Magic:** Improve spacing after heings and paragraphs ([196a55b](https://github.com/stencila/encoda/commit/196a55bd92216d54d479ad77ddb699afec6b859a))
* **Demo Magic:** Update and rename demo-magic.sh ([82b3f2a](https://github.com/stencila/encoda/commit/82b3f2aa921344015122b03bf22f13e243fee1f1))

## [0.115.3](https://github.com/stencila/encoda/compare/v0.115.2...v0.115.3) (2021-04-26)


### Bug Fixes

* **IPYNB:** Improve handing of Vega and Plotly outputs ([f1fe060](https://github.com/stencila/encoda/commit/f1fe06067ffc1f291578a6ba5923e2dc59e5e8ce))

## [0.115.2](https://github.com/stencila/encoda/compare/v0.115.1...v0.115.2) (2021-04-26)


### Bug Fixes

* **dependencies:** update dependency puppeteer to v9 ([2e36597](https://github.com/stencila/encoda/commit/2e365972b2dc457936d5d7398562db914e95ee5e))
* **JATS:** Parse statement title as inline elements ([87faacc](https://github.com/stencila/encoda/commit/87faaccd648c5b49bd63968013b61f74c5169f39))

## [0.115.1](https://github.com/stencila/encoda/compare/v0.115.0...v0.115.1) (2021-04-21)


### Bug Fixes

* **dependencies:** update dependency @stencila/schema to ^1.4.3 ([cf6431b](https://github.com/stencila/encoda/commit/cf6431be177d697b9c3636b446bf5afa503dcbbb))
* **dependencies:** update dependency fp-ts to ^2.10.4 ([1298c7c](https://github.com/stencila/encoda/commit/1298c7c399e216787a7f9e3c9d05d7f797c6c1fb))
* **dependencies:** update dependency js-beautify to ^1.13.13 ([5479962](https://github.com/stencila/encoda/commit/54799622dea2fa6364b3b33a5a1c44aae99ceb78))

# [0.115.0](https://github.com/stencila/encoda/compare/v0.114.0...v0.115.0) (2021-04-16)


### Bug Fixes

* **dependencies:** update dependency @stencila/thema to ^2.24.1 ([5723a8f](https://github.com/stencila/encoda/commit/5723a8f612fd957531da74c62b5f669ff491e731))
* **dependencies:** update dependency citation-js to ^0.5.0 ([db9e3c2](https://github.com/stencila/encoda/commit/db9e3c2a05f9c173351a1800d33271a9173accf0))
* **dependencies:** update dependency fp-ts to ^2.10.2 ([9ddc3f9](https://github.com/stencila/encoda/commit/9ddc3f97a1f42a885daae26fbcdaf024794fc184))
* **dependencies:** update dependency js-beautify to ^1.13.11 ([b2ff869](https://github.com/stencila/encoda/commit/b2ff869bb6782cf0fec758152c5aa579e53327f5))
* **dependencies:** update dependency js-yaml to ^4.1.0 ([f5be5f4](https://github.com/stencila/encoda/commit/f5be5f423ca9be397235b2cca472cc045b1f2c9a))
* **Deps:** Update Schema version ([a94815f](https://github.com/stencila/encoda/commit/a94815fb8457ef52e2770a01960603ff6fe5e261))
* **Deps:** Upgrade dependencies ([70f5a79](https://github.com/stencila/encoda/commit/70f5a793721bf61ad8b7ff6e8ac05b16a1365688))
* **Dir:** Fix bug related to upgraded dependency ([5a14e1a](https://github.com/stencila/encoda/commit/5a14e1ad30ce33cf4fdc16cd0e068f8cbd9e4ec0))


### Features

* **JATS:** Add statement decoder ([66f7d81](https://github.com/stencila/encoda/commit/66f7d8102faa47a5c3da218fd7cb871203136e94))
* **JATS:** Determine claimType from label ([36ef707](https://github.com/stencila/encoda/commit/36ef707834e62285db1f9bce99d575d1658e22be))

# [0.114.0](https://github.com/stencila/encoda/compare/v0.113.0...v0.114.0) (2021-04-13)


### Bug Fixes

* **Coersion:** Merge inline content into a single paragraph ([4eea506](https://github.com/stencila/encoda/commit/4eea5063b93f4a226e340415cf3f01aa31b505d5))
* **Deps:** NPM audit fix ([deaceaf](https://github.com/stencila/encoda/commit/deaceaf45b8aeeb38be30e595f771cbce640a2ec))
* **Deps:** Update Schema version ([0229112](https://github.com/stencila/encoda/commit/02291123385a5e023325ffbdee819c2d0ceae6ed))
* **Deps:** Upgrade Schema ([85ce1e7](https://github.com/stencila/encoda/commit/85ce1e7497afcd40d8fb4923c32f43e6fdc47213))
* **GDoc:** Ensure article content is a BlockContent array ([6bd4ca9](https://github.com/stencila/encoda/commit/6bd4ca9b0993933a0ebcc2a807cdb8e04e6b1f1d))
* **HTML:** Ensure BlockContent array for various properties ([92dba96](https://github.com/stencila/encoda/commit/92dba96d8e5daf98099bceccb583bc790067f2c7))
* **IPYNB:** Updates for changes in schema ([533bd75](https://github.com/stencila/encoda/commit/533bd7509e8d6caeda0cd82fccea2f434e5a229f))
* **JATS:** Ensure BlockContent array for various properties and other fixes ([b1ef3ac](https://github.com/stencila/encoda/commit/b1ef3acfa845fc904394367de80f17d3556c462b))
* **JATS:** Update schema to 1.2.1 with Inline Notes ([1ab835e](https://github.com/stencila/encoda/commit/1ab835ea4eae8a35432e3fd7e85354e104b02242))
* **Markdown:** Ensure BlockContent array for various properties ([de4b3bf](https://github.com/stencila/encoda/commit/de4b3bfe688f1bb51c4693e1613e8aa83d1ef53e))
* **Pandoc:** Ensure BlockContent array for various properties ([189f721](https://github.com/stencila/encoda/commit/189f72124d7aa1a522d388ed1759c11d23b7a1d4))
* **Xmd:** Coerce to inline content ([38bb129](https://github.com/stencila/encoda/commit/38bb12900bfc3281cb6c383387cf425e880856a3))


### Features

* **JATS:** Add footnote ([fd8241a](https://github.com/stencila/encoda/commit/fd8241ab48d31e293b8e2662347ad4372e5444f6))
* **JATS:** Add Footnote as default note type ([365a55c](https://github.com/stencila/encoda/commit/365a55c71566edc4e83c943509c5c625a33ab639))

# [0.113.0](https://github.com/stencila/encoda/compare/v0.112.0...v0.113.0) (2021-03-31)


### Bug Fixes

* **Dates:** Update schema and use `Date`, not strings, everywhere ([f0f2cf7](https://github.com/stencila/encoda/commit/f0f2cf7a63fe1ef2d3378a6aaee4eb7af9f2dc61))
* **dependencies:** update dependency @stencila/schema to ^1.1.4 ([f3dd604](https://github.com/stencila/encoda/commit/f3dd604174b8b0c781256758e98ff735f7a97591))
* **dependencies:** update dependency @stencila/thema to ^2.24.0 ([9414e46](https://github.com/stencila/encoda/commit/9414e46b50ba11b3588380d70fe1448ce08f9759))
* **JATS:** Allow for multiple objects in `fig` ([68fe2b5](https://github.com/stencila/encoda/commit/68fe2b5596aab8a83277a63898937e08a507bf1c))
* **JATS:** Handl alternatives explicitly; ignore fig children that are meta ([6a50e23](https://github.com/stencila/encoda/commit/6a50e23c7ce65658b2d4c92039c69ae7ca6767f5))


### Features

* **JATS:** Decode ids from `graphic` objects ([e849246](https://github.com/stencila/encoda/commit/e849246239ca6c5f95a1391b5fcab827af49398b))

# [0.112.0](https://github.com/stencila/encoda/compare/v0.111.0...v0.112.0) (2021-03-30)


### Bug Fixes

* **dependencies:** update dependency jsdom to ^16.5.2 ([2f2eb96](https://github.com/stencila/encoda/commit/2f2eb96a0502df36305693897c7069316930fb32))
* Allow MathML elements with `m:math` namespace in JATS ([f39df7d](https://github.com/stencila/encoda/commit/f39df7d2bdac919fe6f9568fd2d3446c7fe92c87))
* Use nullish coalescing operator (`??`) ([820bbaa](https://github.com/stencila/encoda/commit/820bbaaddb10a69c720a0448f3d2b85dee5f8dc6))
* **dependencies:** update dependency jsonld to v5 ([117544e](https://github.com/stencila/encoda/commit/117544e29ec1a14dcae7ab68641956bc38769e02))


### Features

* **JATS:** Read ids of paragraphs ([204b32d](https://github.com/stencila/encoda/commit/204b32dcb79d405af5b3b6e9806f9df692b9ddbd))
* **Vega:** Add Vega codec, and Vega figure support to HTML Codec ([4758c21](https://github.com/stencila/encoda/commit/4758c219d452be9780b7c22fec5f0cee3b0ead3a))
* **Vega:** Detect Vega library and version being used ([63a5572](https://github.com/stencila/encoda/commit/63a55722f21bec5d90f3b59656361de2c3aef788))

# [0.111.0](https://github.com/stencila/encoda/compare/v0.110.0...v0.111.0) (2021-03-24)


### Bug Fixes

* **Dependencies:** Update @stencila/schema for MathBlock label ([cf9af72](https://github.com/stencila/encoda/commit/cf9af72801d22a846674e171c63597c8c667ce1c))
* **LaTeX:** Don't take first node of content, take all; avoid use of casts ([2edc99d](https://github.com/stencila/encoda/commit/2edc99dcf3777b64a1dca38c3633bbbbdafe1669))
* **LaTeX:** Match .tex file to LaTeX codec ([096fb04](https://github.com/stencila/encoda/commit/096fb043bbd4c9e15310516ab681fb6270bf1687))
* **LaTeX:** Pass along file path if available ([bf99d3e](https://github.com/stencila/encoda/commit/bf99d3e48f122bb38fa064f63d05a3f17172e669))
* Add equation id and alttext for MathML in JATS ([7aade96](https://github.com/stencila/encoda/commit/7aade969815adc7dd3c169b0dd91037ed99b49ec))
* Fix mixed citation in JATS ([c558ddf](https://github.com/stencila/encoda/commit/c558ddf95af3d75bd9ec337ecc39ae15cc50b072))
* **LaTeX:** Citation modes and content ([63f067e](https://github.com/stencila/encoda/commit/63f067e44fe546855d1f461f4b89c2e1f4b959d0))
* **LaTeX:** Extract equation label to MathBlock id ([f782dd1](https://github.com/stencila/encoda/commit/f782dd1c66518b3c11fdfb3de6af9067ae9de086))
* **LaTeX:** Transform listings marked as executable ([c5e7b16](https://github.com/stencila/encoda/commit/c5e7b1686cd721d6f8d1b1ccd1931cfe1b23b7cf))
* **LaTeX:** Update for new version of Schema ([11b62f1](https://github.com/stencila/encoda/commit/11b62f1f3028f81551a77c0c0e5f8e2923ad74dd))
* **Pandoc:** Do not attempt to JSON.parse input ([2ecd8e1](https://github.com/stencila/encoda/commit/2ecd8e1dea67b713037ac7f7273122b1d9b9c015))
* **Pandoc:** Handle SoftBreaks ([b278f33](https://github.com/stencila/encoda/commit/b278f33ee427528435108dc64c256f56e30f9840))


### Features

* **LaTeX:** Handle commands for code expressions ([761f069](https://github.com/stencila/encoda/commit/761f06914b271be62e53a95ed472709b9c7bf393))
* **Noweb:** Add noweb codec ([a09b39d](https://github.com/stencila/encoda/commit/a09b39d8304a8b0598d82ba181bbf7c346245212))
* **Noweb:** Handle code chunk languages ([c82c529](https://github.com/stencila/encoda/commit/c82c529842a6d64fa4871e9ae761e8c28b61d14d))
* **Noweb:** Parse noweb style code chunks ([8e53b59](https://github.com/stencila/encoda/commit/8e53b590a0f9fb3620974e7a8b366c5afed896cb))
* **Pandoc:** Handle bibliography and references meta fields ([45a6e5c](https://github.com/stencila/encoda/commit/45a6e5cb450e3ff2162157fe2fc619a6d5df0c9f)), closes [#842](https://github.com/stencila/encoda/issues/842)

# [0.110.0](https://github.com/stencila/encoda/compare/v0.109.5...v0.110.0) (2021-03-23)


### Bug Fixes

* **Cite:** Use citationPrefix and citationSuffix ([926e498](https://github.com/stencila/encoda/commit/926e49821c3a028478e1a34b3954823be5addfd7))
* **Cite:** Use correct microdata attribute name for prefix and suffix ([07cb26a](https://github.com/stencila/encoda/commit/07cb26ab0d85b2d28fb0dccd5e37d43701dc8446))
* **dependencies:** update dependency @stencila/thema to ^2.23.0 ([e30851d](https://github.com/stencila/encoda/commit/e30851ddecde4b2d39df68e3e9d3809f11214d1e))
* **dependencies:** update dependency globby to ^11.0.3 ([206ba85](https://github.com/stencila/encoda/commit/206ba85d1f11ebdabfac2699cc2f230a9c41aa63))
* **HTML:** Use correct property when decoding ([5cf9bfd](https://github.com/stencila/encoda/commit/5cf9bfdb3af9f197327c5b91cd01d51dd37a9abf))
* **JATS:** Add encodeCiteGroup and use citationMode ([bae5ef4](https://github.com/stencila/encoda/commit/bae5ef4098a0b1730fe1a85f167866699479168f))
* **Markdown:** Decoding of parenthetical citations ([d9aa005](https://github.com/stencila/encoda/commit/d9aa0059dca58f476bfe7fc6240cfdd093dad537))
* **Markdown:** Properly locate and eat characters ([8619ded](https://github.com/stencila/encoda/commit/8619dede4fdec581c6b154d8018a23896de90cc7))
* **Markdown:** Respect citationMode when encoding Cite nodes ([1a0d84f](https://github.com/stencila/encoda/commit/1a0d84fefde4cb7414d5032b9261db2e07166c5c))
* **Markdown:** Separate parsing of narrative and parenthetical citations ([de559a5](https://github.com/stencila/encoda/commit/de559a523ee2691eadb17083e64d85c5e2c18a2a))
* **Pandoc:** Use new citation modes ([865f976](https://github.com/stencila/encoda/commit/865f976749935eaa189ef528e86b9a67aac4e708))
* **Reshape:** Consider citationMode when grouping ([d8d1640](https://github.com/stencila/encoda/commit/d8d1640f950a426a87efbf1d068ee8f861433cf7))


### Features

* **HTML:** Encode citationMode for Cite nodes ([a7ace78](https://github.com/stencila/encoda/commit/a7ace78e6ea28e0c51aecee16f06fc868225a0cc))
* **HTML:** Separate authors from years ([5b6abe8](https://github.com/stencila/encoda/commit/5b6abe8e4545d8df2f1673e80014ff04c02536fe))

## [0.109.5](https://github.com/stencila/encoda/compare/v0.109.4...v0.109.5) (2021-03-19)


### Bug Fixes

* **CSL:** Handling of literal names and organizational authors ([ecdc925](https://github.com/stencila/encoda/commit/ecdc925d7f0578f818e9811233677d8f84dba551))
* **dependencies:** update dependency citation-js to ^0.5.0-alpha.10 ([32d98bd](https://github.com/stencila/encoda/commit/32d98bd5a213b697dcdb1ad26cee394dabc5f4fc))
* **dependencies:** update dependency tempy to ^1.0.1 ([e01a6bf](https://github.com/stencila/encoda/commit/e01a6bfd5b42a3c3197fe3dc40167acc64721610))

## [0.109.4](https://github.com/stencila/encoda/compare/v0.109.3...v0.109.4) (2021-03-17)


### Bug Fixes

* **Dependencies:** Changes for Schema v1 ([53a3f57](https://github.com/stencila/encoda/commit/53a3f57d7160e56dd821aa9fb68794077ed6b807))

## [0.109.3](https://github.com/stencila/encoda/compare/v0.109.2...v0.109.3) (2021-03-16)


### Bug Fixes

* **dependencies:** update dependency @stencila/thema to ^2.22.1 ([ebcf971](https://github.com/stencila/encoda/commit/ebcf9715aa4b4914d8c882b49008694d1414e005))
* **dependencies:** update dependency async-lock to ^1.2.8 ([981728c](https://github.com/stencila/encoda/commit/981728c7ec8f6d3174d089f20d56371942522f97))
* **dependencies:** update dependency fp-ts to ^2.9.5 ([a98c9bb](https://github.com/stencila/encoda/commit/a98c9bb21bdd14c7bb7103555c39e645fe98983a))
* **dependencies:** update dependency fs-extra to ^9.1.0 ([527bc75](https://github.com/stencila/encoda/commit/527bc75343e52a300cbe6c51e36ea5e61440fdcc))
* **dependencies:** update dependency globby to ^11.0.2 ([5b3309a](https://github.com/stencila/encoda/commit/5b3309a65b75d658382397559543b93e62a98df1))
* **dependencies:** update dependency got to ^11.8.2 ([7f5793d](https://github.com/stencila/encoda/commit/7f5793d6a024ec669d1a76826c29ec98184b84bf))
* **dependencies:** update dependency js-beautify to ^1.13.5 ([a5ec760](https://github.com/stencila/encoda/commit/a5ec7609da58e442fc0824f36fa0fca37fff1e31))
* **dependencies:** update dependency jsdom to ^16.5.1 ([4e0cc4e](https://github.com/stencila/encoda/commit/4e0cc4ef233a6f9a0f5777177ceb10787cb8dc72))
* **dependencies:** update dependency jsonld to ^4.0.1 ([66e7a88](https://github.com/stencila/encoda/commit/66e7a883a6b90abaa32888233256a157fea1dae4))
* **dependencies:** update dependency jszip to ^3.6.0 ([1c187dc](https://github.com/stencila/encoda/commit/1c187dc0931fc2aef9f8a21dda6fa099e57cd48a))
* **dependencies:** update dependency mime to ^2.5.2 ([cf3bb1a](https://github.com/stencila/encoda/commit/cf3bb1ad185304c5616f659d9fed8127eeba4f60))
* **dependencies:** update dependency parse-full-name to ^1.2.5 ([2811586](https://github.com/stencila/encoda/commit/2811586e4924fd735143e20ecb654bba9c5018a5))
* **dependencies:** update dependency pdf-lib to ^1.16.0 ([051c6f2](https://github.com/stencila/encoda/commit/051c6f28dea42553817e2b4965ca8477d5de067c))
* **dependencies:** update dependency plotly.js-dist to ^1.58.4 ([164a8fc](https://github.com/stencila/encoda/commit/164a8fca4f7daa2e84d9ad165a37e5581f3ede4e))
* **dependencies:** update dependency remark-sub-super to ^1.0.20 ([9254917](https://github.com/stencila/encoda/commit/925491728c1ed992995884854d781e9af4507533))
* **dependencies:** update dependency trash to ^7.1.1 ([777fb97](https://github.com/stencila/encoda/commit/777fb9759c723c7af8ef63bfc0590a8da8706f21))
* **dependencies:** update dependency unified to ^9.2.1 ([c015967](https://github.com/stencila/encoda/commit/c015967332ace88ceb840d43a813fa72946e7b48))

## [0.109.2](https://github.com/stencila/encoda/compare/v0.109.1...v0.109.2) (2021-03-09)


### Bug Fixes

* **Docx:** Improve contrasts for text styles ([fd7ca13](https://github.com/stencila/encoda/commit/fd7ca135fb9fe5f321a355a95b21dfe4a8d949ae))

## [0.109.1](https://github.com/stencila/encoda/compare/v0.109.0...v0.109.1) (2021-03-09)


### Bug Fixes

* **MD:** Don't treat email addresses as citations ([be8b5ff](https://github.com/stencila/encoda/commit/be8b5ffdc9e7313803ff5d336ae6f25340c00467))

# [0.109.0](https://github.com/stencila/encoda/compare/v0.108.0...v0.109.0) (2021-03-05)


### Features

* **RPNG:** Crop out RPNG symbol indicator when decoding images ([80c7082](https://github.com/stencila/encoda/commit/80c7082141091a007a7817bde3820d44190b53c5))

# [0.108.0](https://github.com/stencila/encoda/compare/v0.107.1...v0.108.0) (2021-03-02)


### Features

* **Reshape:** Add groupCitesIntoGiteGroup function ([7614877](https://github.com/stencila/encoda/commit/7614877fed28615b891dbed7db204dee3957f368)), closes [#831](https://github.com/stencila/encoda/issues/831)

## [0.107.1](https://github.com/stencila/encoda/compare/v0.107.0...v0.107.1) (2021-03-01)


### Bug Fixes

* **dependencies:** update dependency puppeteer to v8 ([3f3cac0](https://github.com/stencila/encoda/commit/3f3cac03993a76e948c6c4144884df826006aa19))

# [0.107.0](https://github.com/stencila/encoda/compare/v0.106.1...v0.107.0) (2021-02-24)


### Features

* **Reshape:** Heading and empty blocks ([6797528](https://github.com/stencila/encoda/commit/67975282559ab78b3fbe99d8b4a4c438ec9d227c))

## [0.106.1](https://github.com/stencila/encoda/compare/v0.106.0...v0.106.1) (2021-02-19)


### Bug Fixes

* **ELife:** Don't scale graphic assets to support low-res images ([c7efc36](https://github.com/stencila/encoda/commit/c7efc363dc2ce67b3ed782dee9335fb403bbafc3)), closes [#286](https://github.com/stencila/encoda/issues/286)

# [0.106.0](https://github.com/stencila/encoda/compare/v0.105.2...v0.106.0) (2021-02-16)


### Bug Fixes

* **JATS:** Decode reference identifiers ([2fc33f6](https://github.com/stencila/encoda/commit/2fc33f6dade9a245e249cbd8458cfa1899d01902)), closes [#413](https://github.com/stencila/encoda/issues/413)


### Features

* **HTML:** Encode DOI and other identifiers in references ([2cbe99e](https://github.com/stencila/encoda/commit/2cbe99eeb79ede286d5b3deacb8b22650f6456f0)), closes [#816](https://github.com/stencila/encoda/issues/816)

## [0.105.2](https://github.com/stencila/encoda/compare/v0.105.1...v0.105.2) (2021-02-15)


### Bug Fixes

* **Puppeteer:** Upgrade version and use own types ([cd3be97](https://github.com/stencila/encoda/commit/cd3be97fcd18dc239630f5323ac3893076eb82cf))

## [0.105.1](https://github.com/stencila/encoda/compare/v0.105.0...v0.105.1) (2021-02-15)


### Bug Fixes

* **dependencies:** update dependency jsonld to v4 ([7f2ace6](https://github.com/stencila/encoda/commit/7f2ace6577074a42bd58fe7dec8aa4a2738f9935))
* **HTML:** Remove classes in Cite nodes ([b0ce8d3](https://github.com/stencila/encoda/commit/b0ce8d3e4dae4ce600965d2cfaeb3e2750f51f17))

# [0.105.0](https://github.com/stencila/encoda/compare/v0.104.5...v0.105.0) (2021-02-12)


### Bug Fixes

* **Coerce:** No longer use immer ([dee60dd](https://github.com/stencila/encoda/commit/dee60ddf3eeffde34e39a7cb347491973219ba3e))
* **dependencies:** update dependency @stencila/logga to v4 ([e4387f7](https://github.com/stencila/encoda/commit/e4387f72da84da6f2e74cec838acc782194b2b2d))
* **dependencies:** update dependency js-yaml to v4 ([4a7f6d4](https://github.com/stencila/encoda/commit/4a7f6d4509587eed58a902938dad8b3e2d52d17a))
* **dependencies:** update dependency puppeteer to v7 ([4d1b48f](https://github.com/stencila/encoda/commit/4d1b48f70963c514730b8043c20fa58d3213b0a5))
* **Deps:** Patch for Puppeteer export assignment ([0ca62bd](https://github.com/stencila/encoda/commit/0ca62bdfc31f0b367e9c6bcfa93e621f6707fcf0))
* **Deps:** Upgrade JSON5 ([e80d3f6](https://github.com/stencila/encoda/commit/e80d3f6f6acc062976ca51d21f8102b2d0130e55))
* **Deps:** Upgrade JSONLD ([67b60b7](https://github.com/stencila/encoda/commit/67b60b778592d76031b452d0640558676ea9c76c))
* **Deps:** Upgrade to latest Stencila libs ([502c952](https://github.com/stencila/encoda/commit/502c95223c53b18edf8db99deb757e17b6c4828f))
* **HTML:** Encode content of date in references using year only ([b7e9642](https://github.com/stencila/encoda/commit/b7e96422e94a8c9d488763669b74a1c758d667ca))
* **PDF:** Use enum variant ([b484cda](https://github.com/stencila/encoda/commit/b484cda3f00f33758d698c7ab31dc154a08db581))
* **Puppeteer:** Type fixes ([13df791](https://github.com/stencila/encoda/commit/13df791141c9e187621e1bc7d8c34193cc0b2a8b))
* **Reshape:** Remove lookahead condition ([e397ffa](https://github.com/stencila/encoda/commit/e397ffaeb5c78af6bc48adf3fb4202423d5f091d))
* **RPNG:** Use element size for screenshot dimension instead of viewport ([2682e9b](https://github.com/stencila/encoda/commit/2682e9b524ebd0f8be0303e5247bb2bc1e1c011c))
* **YAML:** Updates for v4 of js-yaml ([3f4d67d](https://github.com/stencila/encoda/commit/3f4d67d8528a9c23098ea505d1687ee7a9c7e0ae))


### Features

* **HTML:** Encode both numeric and author-year citation styles ([1ef5200](https://github.com/stencila/encoda/commit/1ef5200e84140b24c051922593bc3d239be4b28c))
* **Markdown:** Add encoding of CiteGroups ([4bc1974](https://github.com/stencila/encoda/commit/4bc1974510efb44743c6c146bbeb7ebb7e41d287))
* **Reshape:** Detection of numbered citations ([373df27](https://github.com/stencila/encoda/commit/373df27379f6b74497ad9ec328b70bf25954ff90))
* **Reshape:** Give references an id ([465dead](https://github.com/stencila/encoda/commit/465dead15f083ddaa5091fdf59a6f0bf0fc19f4c))

## [0.104.5](https://github.com/stencila/encoda/compare/v0.104.4...v0.104.5) (2021-01-14)


### Bug Fixes

* **dependencies:** update dependency better-ajv-errors to ^0.7.0 ([f904182](https://github.com/stencila/encoda/commit/f904182898b5120917b294757fecda904062f254))

## [0.104.4](https://github.com/stencila/encoda/compare/v0.104.3...v0.104.4) (2020-12-21)


### Bug Fixes

* **dependencies:** update dependency mime to ^2.4.7 ([aee6138](https://github.com/stencila/encoda/commit/aee61386cc2da7cf26e82db174be8b135949f16c))
* **dependencies:** update dependency unist-util-select to ^3.0.4 ([209c6e5](https://github.com/stencila/encoda/commit/209c6e53c9cc5b8d206d5f98705a011ca95f67bc))

## [0.104.3](https://github.com/stencila/encoda/compare/v0.104.2...v0.104.3) (2020-12-14)


### Bug Fixes

* **GDoc:** Use nodeInPng option for proper themeing ([7c258ea](https://github.com/stencila/encoda/commit/7c258eacd6fba33bb6a22addf859e8b26d7d29f9))

## [0.104.2](https://github.com/stencila/encoda/compare/v0.104.1...v0.104.2) (2020-12-13)


### Bug Fixes

* **dataURIs:** Log warning, not error if file not found. ([c6f3dcb](https://github.com/stencila/encoda/commit/c6f3dcb2bbcc925c67f41b6d0713a53ee5101255))
* **Deps:** Update deps ([4f2a7e0](https://github.com/stencila/encoda/commit/4f2a7e0dc58397c536dcf38b03735ace34fc0c1d))
* **GDoc:** DO not write media to sibling folder. ([39813e0](https://github.com/stencila/encoda/commit/39813e0e660743964dee17cd19fff55069113c7a))
* **RPNG:** Add selectors for math node types ([217cbf2](https://github.com/stencila/encoda/commit/217cbf264573ec04d64e0e4fe34d5022325e5730))

## [0.104.1](https://github.com/stencila/encoda/compare/v0.104.0...v0.104.1) (2020-12-09)


### Bug Fixes

* **dependencies:** update dependency @stencila/executa to ^1.15.4 ([47c78a1](https://github.com/stencila/encoda/commit/47c78a1da25934c8ebd61ac75204cea80e33a459))
* **dependencies:** update dependency @stencila/thema to ^2.20.7 ([477f42f](https://github.com/stencila/encoda/commit/477f42fd91b0275aa839f60778c9b26d07fa2a41))
* **dependencies:** update dependency async-lock to ^1.2.6 ([53a85a3](https://github.com/stencila/encoda/commit/53a85a3887b10829d30b06ba2d71d7186a2d4235))
* **dependencies:** update dependency js-yaml to ^3.14.1 ([cd51480](https://github.com/stencila/encoda/commit/cd51480c0d34e19b46262d3e21c3b0d73e7d2aa5))
* **dependencies:** update dependency pdf-lib to ^1.13.0 ([7017ab4](https://github.com/stencila/encoda/commit/7017ab4536a5bbbf7c470fb6094755cdae1560c0))
* **dependencies:** update dependency plotly.js-dist to ^1.58.2 ([c31fb2c](https://github.com/stencila/encoda/commit/c31fb2cc87e7f1af69d4dc9c91dac840d6f72812))
* **dependencies:** update dependency vfile to ^4.2.1 ([7ccd235](https://github.com/stencila/encoda/commit/7ccd235dd719fe23f643c9fe710a398a126fa455))

# [0.104.0](https://github.com/stencila/encoda/compare/v0.103.2...v0.104.0) (2020-12-06)


### Bug Fixes

* **Biblio codecs:** Various fixes ([3f02fca](https://github.com/stencila/encoda/commit/3f02fca4abf22ca60a095c1516ef25327b3119b3))
* **Cache:** Remove unused async version; use temp dir ([1262f6b](https://github.com/stencila/encoda/commit/1262f6bdcad04c1c3495f03172673fd80940d7b8))
* **Cache:** Use the same tempdir on each instantiation ([4ba76a7](https://github.com/stencila/encoda/commit/4ba76a75bc97ca8a1ee79a62d6a3c17550068ade))
* **CSL:** Handle string nodes ([93419ea](https://github.com/stencila/encoda/commit/93419eaa36552ac605be18d23f682eed64d581bb))
* **CSL:** Use more of parsed data ([2e60777](https://github.com/stencila/encoda/commit/2e60777ca29d49c7cecfd9ec827bbc89a2853425))
* **DOI:** Fetch data directly ([a295205](https://github.com/stencila/encoda/commit/a2952053395cb30627aa50b28d837d98e32ea2a3))
* **GDoc:** Ignore empty paragraphs ([faf47dd](https://github.com/stencila/encoda/commit/faf47ddc6e564a8eced22ccb88175d51bd9785e1))
* **HTTP:** Add contact information to user agent header ([d897385](https://github.com/stencila/encoda/commit/d897385ebb0ec913c464347ea8bc0331e8019bc6))
* **HTTP:** Retry on errors ([80bb069](https://github.com/stencila/encoda/commit/80bb069f1f8a64cefb376c9b05aa441fd38d91cc))
* **Logging:** Use consistent format for message ([87477cd](https://github.com/stencila/encoda/commit/87477cdf5b04da9452db145998c685569b40e0d4))
* **Pandoc:** Consistent style name; separate out chunk labels ([2452b1f](https://github.com/stencila/encoda/commit/2452b1fb537d59b2ab956f216e4d397317a37053))
* **PNG:** Allow setting of selector ([a471d8c](https://github.com/stencila/encoda/commit/a471d8cafd22e45942b7d37aebf2dfd23bd04c7a))
* **Reshape:** Linting and minor fixes ([6013374](https://github.com/stencila/encoda/commit/601337439446d432dee0be21e077ebb008975d22))


### Features

* Add options to turn off coerce and reshape ([4c87ea7](https://github.com/stencila/encoda/commit/4c87ea79450e50fbdc2aa6e12ededa597266d4e0))
* **DOCX:** Retain styles when decoding ([82e77ec](https://github.com/stencila/encoda/commit/82e77ec261bb1cd471f570968b39fa868eab04f5))
* **GDoc:** Fetch node content from Hub if possible ([34b0ab5](https://github.com/stencila/encoda/commit/34b0ab500103737f7efe7f9f8df2477d3cc15141))
* **Pandoc:** Allow for alternative ways to encode code chunks ([8300f88](https://github.com/stencila/encoda/commit/8300f8808d86789360baa47ded85fbb5fc1396e8))
* **Reshape:** Add reshape function and apply on load and read ([c0bed26](https://github.com/stencila/encoda/commit/c0bed26863afd986c03014d153919d718372e01b))
* **Reshape:** Detect captions using regexes ([720adaf](https://github.com/stencila/encoda/commit/720adaf180c38695152db14837320c0af85efa35))
* **Reshape:** Infer authors and other properties ([e52cf82](https://github.com/stencila/encoda/commit/e52cf82df7298adf3c91d07fa7faa3cee9e038d6))

## [0.103.2](https://github.com/stencila/encoda/compare/v0.103.1...v0.103.2) (2020-12-03)


### Bug Fixes

* **dependencies:** update dependency @stencila/executa to ^1.15.3 ([f9f6171](https://github.com/stencila/encoda/commit/f9f61716e786d7e348588add1d565770af75e404))
* **dependencies:** update dependency @stencila/thema to ^2.20.4 ([f4f26b3](https://github.com/stencila/encoda/commit/f4f26b3b599377260e4ab2428bb16c858db94e24))
* **dependencies:** update dependency fp-ts to ^2.9.1 ([8532bf8](https://github.com/stencila/encoda/commit/8532bf8c65d30ff660d62724d9582b720651aaec))
* **dependencies:** update dependency trash to v7 ([f876e38](https://github.com/stencila/encoda/commit/f876e3841bbd8f2673b6ea7037e77c326fb8a312))
* **dependencies:** update dependency unist-util-select to ^3.0.3 ([c3745fd](https://github.com/stencila/encoda/commit/c3745fd4ee781322cd3f6e788ee16e20dd3ac930))
* **dependencies:** update dependency xlsx to ^0.16.9 ([0ae6555](https://github.com/stencila/encoda/commit/0ae6555012849534b654f4af0682e75b52a683b3))

## [0.103.1](https://github.com/stencila/encoda/compare/v0.103.0...v0.103.1) (2020-11-24)


### Bug Fixes

* **HTML:** Do not indent <address> elements ([7880a81](https://github.com/stencila/encoda/commit/7880a813261d3a29b4af97938d8a567ccd07066f)), closes [#764](https://github.com/stencila/encoda/issues/764)

# [0.103.0](https://github.com/stencila/encoda/compare/v0.102.3...v0.103.0) (2020-11-20)


### Bug Fixes

* **Crossref:** Add DOI and URL as encode options ([535e2c4](https://github.com/stencila/encoda/commit/535e2c42f654d9657f8c1ce72ba489df758ae27b))
* **Crossref:** Add encoding of references ([05718fe](https://github.com/stencila/encoda/commit/05718fe29fbc291a033f303deca51949575bcce5))
* **Crossref:** Adjust for new Got API ([ff6ff74](https://github.com/stencila/encoda/commit/ff6ff74ac1653d3b79a31fc75c5efcf4c11de831))
* **Crossref:** Updates for new Schema version ([bb77da1](https://github.com/stencila/encoda/commit/bb77da1a869b7a8a2e134f2339ea6c6490349248))
* **Deps:** Upgrade Schema ([27aee7e](https://github.com/stencila/encoda/commit/27aee7e77dfdd3abd091a892a9fba25f4202f59e))


### Features

* **Crossref:** Encoding of reviews to metadata deposit XML ([259a96b](https://github.com/stencila/encoda/commit/259a96b1d45a04c2153b684bc83887fa2087d7ba))

## [0.102.3](https://github.com/stencila/encoda/compare/v0.102.2...v0.102.3) (2020-11-19)


### Bug Fixes

* **dependencies:** update dependency @stencila/schema to ^0.47.1 ([13b981c](https://github.com/stencila/encoda/commit/13b981c82cdc7b28d7b37017d9251a5651fa2923))
* **dependencies:** update dependency fp-ts to ^2.8.6 ([60d8700](https://github.com/stencila/encoda/commit/60d870082b0cda59eb0c0434aa4d0e85860f0fe1))
* **dependencies:** update dependency immer to ^7.0.15 ([803886e](https://github.com/stencila/encoda/commit/803886ee00c6d9b6ed16dd2ed7a28f4c8ba53b4d))
* **dependencies:** update dependency pdf-lib to ^1.12.0 ([4d2c2df](https://github.com/stencila/encoda/commit/4d2c2df05c7cd09e4e23535729142a27efc9d204))
* **dependencies:** update dependency puppeteer to ^5.5.0 ([9bd4b74](https://github.com/stencila/encoda/commit/9bd4b742774805c6584ea5bb0a955958a8ead096))
* **Markdown:** Fix encoding of inline HTML tags ([89b81f5](https://github.com/stencila/encoda/commit/89b81f58d781525a2948bfbf82cb39397adac04c))

## [0.102.2](https://github.com/stencila/encoda/compare/v0.102.1...v0.102.2) (2020-11-11)


### Bug Fixes

* **HTML:** Use innerHTML to avoid escaping in JSON ([ba05c3e](https://github.com/stencila/encoda/commit/ba05c3e78fb041d033f12133ba7a546639ef8068)), closes [#749](https://github.com/stencila/encoda/issues/749)

## [0.102.1](https://github.com/stencila/encoda/compare/v0.102.0...v0.102.1) (2020-11-10)


### Bug Fixes

* **Puppeteer:** Do not use sandbox when inside Docker ([c598477](https://github.com/stencila/encoda/commit/c5984773db74154fbb7a42e8a9ab70b7b351c0e3))

# [0.102.0](https://github.com/stencila/encoda/compare/v0.101.3...v0.102.0) (2020-11-10)


### Bug Fixes

* **HTML:** Make encoding of Plotly images consistent with Web component ([b9ea97a](https://github.com/stencila/encoda/commit/b9ea97a1969650220151b0a6da9e47fdecd8d7ac))
* **IPYNB:** Correct transformation of MIME bundle data to string ([83261d7](https://github.com/stencila/encoda/commit/83261d7f3a369edb3aa299afea92346e18e92b67))
* **IPYNB:** Fix handling of different output types ([46c1124](https://github.com/stencila/encoda/commit/46c1124cd48b64d50c76e3f42acb59ac01eb52c6))


### Features

* **Data URIs:** Allow the encoding of a Data URI from a JS object ([4a1dabd](https://github.com/stencila/encoda/commit/4a1dabd2c6465f608d3faa2a2d9c4acacc08f74f))
* **Deps:** Add plotly.js-dist ([ad39219](https://github.com/stencila/encoda/commit/ad392193e24b40fc941643272af3a0ae1b8a9444))
* **HTML:** Encode a ImageObject as <picture> if necessary ([80728bf](https://github.com/stencila/encoda/commit/80728bf9c8c5e4c929918a7094c614977e66ed52))
* **Plotly:** Add codec for Plotly JSON ([5789264](https://github.com/stencila/encoda/commit/57892644a7ff7c6c476321e8f4dca6caee91bd3f))

## [0.101.3](https://github.com/stencila/encoda/compare/v0.101.2...v0.101.3) (2020-11-06)


### Bug Fixes

* **dependencies:** update dependency @stencila/executa to ^1.15.1 ([7fe1994](https://github.com/stencila/encoda/commit/7fe199472ddfb4ca171e249dcf09b82c5571da6d))
* **dependencies:** update dependency fp-ts to ^2.8.5 ([b522298](https://github.com/stencila/encoda/commit/b5222989df377dbd99d2c601ab2b8e4aae15962b))
* **dependencies:** update dependency unist-util-filter to ^2.0.3 ([31f39cb](https://github.com/stencila/encoda/commit/31f39cb17fc923ce7661b753307baaa9acb4db1f))
* **dependencies:** update dependency unist-util-select to ^3.0.2 ([8bfd054](https://github.com/stencila/encoda/commit/8bfd0544f44fbe28c51ffdb36b61ebfff5555898))
* **HTML:** Handle <br> elements; trim warning sample ([a4685e1](https://github.com/stencila/encoda/commit/a4685e1561c771a3ea3be53ea036ddcaf61ad880))
* **IPYNB:** Ignore Markdown cells with no content ([ad496da](https://github.com/stencila/encoda/commit/ad496da92f77760e3118f8856af2fff44b68768a))

## [0.101.2](https://github.com/stencila/encoda/compare/v0.101.1...v0.101.2) (2020-11-03)


### Bug Fixes

* **Cite nodes:** Include organization name in cite content ([5d604ae](https://github.com/stencila/encoda/commit/5d604aeeb8214c5f0b5e380bee926b19632074b8))

## [0.101.1](https://github.com/stencila/encoda/compare/v0.101.0...v0.101.1) (2020-11-01)


### Bug Fixes

* **Organizational authors:** Distinguish org authors in BibTeX ([ee287a3](https://github.com/stencila/encoda/commit/ee287a33027c7844d4a25f82a99075e4411efa23)), closes [#737](https://github.com/stencila/encoda/issues/737)

# [0.101.0](https://github.com/stencila/encoda/compare/v0.100.0...v0.101.0) (2020-10-30)


### Bug Fixes

* **dependencies:** update dependency @stencila/thema to ^2.20.0 ([7ceb8a0](https://github.com/stencila/encoda/commit/7ceb8a01cda332067b3b97eec290ca3352521c21))
* **dependencies:** update dependency puppeteer to ^5.4.1 ([2fb87d9](https://github.com/stencila/encoda/commit/2fb87d9435bf4ffd6db36052fd09339606cceede))


### Features

* **Markdown & HTML:** Handling of audio and video objects ([8a49af6](https://github.com/stencila/encoda/commit/8a49af6e227568d3fd17104606b5f119cc1dc824))

# [0.100.0](https://github.com/stencila/encoda/compare/v0.99.16...v0.100.0) (2020-10-29)


### Bug Fixes

* **Cite nodes:** Defere populating content until encoding ([02137d2](https://github.com/stencila/encoda/commit/02137d24199a5a81bcc86d1bd11b845339732bce)), closes [#732](https://github.com/stencila/encoda/issues/732) [#673](https://github.com/stencila/encoda/issues/673)
* **HTML:** Encode url around title ([862ce14](https://github.com/stencila/encoda/commit/862ce14d97ee16f70a1b391c3d12432d8013f2d5)), closes [#733](https://github.com/stencila/encoda/issues/733)
* **HTML:** Ensure that CodeChunk ids are encoded ([5ddce03](https://github.com/stencila/encoda/commit/5ddce033719e5c4008b40b415cdd373a4790aaf7))
* **IPYNB:** Ignore empty code chunks ([d39a16f](https://github.com/stencila/encoda/commit/d39a16fa1d06c9f7926c79d97313b3236d172191)), closes [#731](https://github.com/stencila/encoda/issues/731)
* **IPYNB:** Remove redundant name property when decoding authors ([0a1b4ef](https://github.com/stencila/encoda/commit/0a1b4ef8721344f82a62a52ddbc4714c05843037))
* **Markdown:** Make the first row of tables rowType:header ([54332bc](https://github.com/stencila/encoda/commit/54332bc55f1bd9614597cbe8c323cdf811c469dd))


### Features

* **IPYNB:** Handle id, label and caption on code chunks ([2a387fa](https://github.com/stencila/encoda/commit/2a387fac0d7fa646b349ac8bb0f1935a808a0f43))

## [0.99.16](https://github.com/stencila/encoda/compare/v0.99.15...v0.99.16) (2020-10-27)


### Bug Fixes

* **HTML:** Encode classificatory properties of a creative work ([73d015a](https://github.com/stencila/encoda/commit/73d015a6ca3750e19f4807b2556c2f327779342c)), closes [#679](https://github.com/stencila/encoda/issues/679)
* **HTML:** Encode Organization members as a list of members (ol > li) ([1c66aa9](https://github.com/stencila/encoda/commit/1c66aa9c115795680b145fd2a957ee295b67a03d))
* **HTML:** Encode organization members as a nested list ([3a3e3ed](https://github.com/stencila/encoda/commit/3a3e3edce54477111222119864314470fadc0dff)), closes [#691](https://github.com/stencila/encoda/issues/691)
* **JATS:** Decode members of a collab author ([05c94f9](https://github.com/stencila/encoda/commit/05c94f99a64fe20b128d858102126f3671b60302)), closes [#690](https://github.com/stencila/encoda/issues/690)

## [0.99.15](https://github.com/stencila/encoda/compare/v0.99.14...v0.99.15) (2020-10-22)


### Bug Fixes

* **GDoc:** Allow for dataURI in image URIs ([691b8e5](https://github.com/stencila/encoda/commit/691b8e5f199f2caf4302ab855c980fc811d85730))

## [0.99.14](https://github.com/stencila/encoda/compare/v0.99.13...v0.99.14) (2020-10-22)


### Bug Fixes

* **dependencies:** update dependency @stencila/executa to ^1.15.0 ([599617c](https://github.com/stencila/encoda/commit/599617ce68fccebb7924d0c0b581df691bde7210))
* **dependencies:** update dependency @stencila/logga to ^3.0.1 ([7a7319e](https://github.com/stencila/encoda/commit/7a7319ef76ffc70d75fbcd86962a448278b6a385))
* **dependencies:** update dependency citation-js to ^0.5.0-alpha.9 ([45b856d](https://github.com/stencila/encoda/commit/45b856d5e7d5142723c6676a2a8d4f1dbe272e2d))
* **dependencies:** update dependency got to ^11.8.0 ([d9593f6](https://github.com/stencila/encoda/commit/d9593f6fc8fc5044f323d0e5dea553eaec73aaaa))
* **dependencies:** update dependency immer to ^7.0.14 ([da8b9c4](https://github.com/stencila/encoda/commit/da8b9c4f235f596a64aebb9022de3eae926420f0))
* **XMD:** Allow for Windows line endings ([231933e](https://github.com/stencila/encoda/commit/231933e536b5295f7f2d724e1cb53126b0f762ed)), closes [#717](https://github.com/stencila/encoda/issues/717)

## [0.99.13](https://github.com/stencila/encoda/compare/v0.99.12...v0.99.13) (2020-10-14)


### Bug Fixes

* **GDoc:** Download images to temporary file; add image to test fixture ([97dca1b](https://github.com/stencila/encoda/commit/97dca1b607e8c21f0773f2b2f66686db2a73d587))
* **GDoc:** Handle undefined list more gracefully ([a9fec19](https://github.com/stencila/encoda/commit/a9fec19edd060e645bed2a68f87e1da596632e61))

## [0.99.12](https://github.com/stencila/encoda/compare/v0.99.11...v0.99.12) (2020-10-14)


### Bug Fixes

* **dependencies:** update dependency @stencila/executa to ^1.14.2 ([65648e2](https://github.com/stencila/encoda/commit/65648e2972804f8905f665a6a4c1733780f4b721))
* **dependencies:** update dependency @stencila/schema to ^0.46.5 ([d36127b](https://github.com/stencila/encoda/commit/d36127b227a8518ad5b8d64a5dcc4d0afda13d0e))
* **dependencies:** update dependency @stencila/thema to ^2.19.1 ([146ed6f](https://github.com/stencila/encoda/commit/146ed6f2f5abd05322a54a561aaacfb7c3dda4d1))
* **dependencies:** update dependency ajv to ^6.12.6 ([62df782](https://github.com/stencila/encoda/commit/62df7826c11bae06ad013a2a94ac4bcbee186317))
* **dependencies:** update dependency fp-ts to ^2.8.4 ([6fe71c1](https://github.com/stencila/encoda/commit/6fe71c198e728d2c9a77c17018f3afeafb28dc67))
* **dependencies:** update dependency jsonld to ^3.2.0 ([a392ccd](https://github.com/stencila/encoda/commit/a392ccdcfb81893dae7e4a19f766ab7ee8906194))
* **dependencies:** update dependency mdast-util-compact to v3 ([7bb74c4](https://github.com/stencila/encoda/commit/7bb74c46e3b9b0b1105a33553c382b4881b33c85))
* **dependencies:** update dependency pdf-lib to ^1.11.2 ([f6fc8e9](https://github.com/stencila/encoda/commit/f6fc8e98f68bb08c056e7da65070d3f17ba16065))
* **dependencies:** update dependency tempy to ^0.7.1 ([2230f5e](https://github.com/stencila/encoda/commit/2230f5ede8c4a97fbddefcd81c09776a63a1cc66))
* **dependencies:** update dependency tempy to v1 ([c46c63b](https://github.com/stencila/encoda/commit/c46c63bf68816886ddf5729aeed90bf03f98d234))
* **dependencies:** update dependency xlsx to ^0.16.8 ([cc2181a](https://github.com/stencila/encoda/commit/cc2181a8bb5d13c0bac3a8c78a7b1f07aff3ab8f))

## [0.99.11](https://github.com/stencila/encoda/compare/v0.99.10...v0.99.11) (2020-09-27)


### Bug Fixes

* **dependencies:** update dependency @stencila/thema to ^2.17.2 ([f74599a](https://github.com/stencila/encoda/commit/f74599aa2c0b8000831bbd89f495f19711ac1308))
* **HTML:** Don't wrap inline elements from description in paragraphs ([1133eac](https://github.com/stencila/encoda/commit/1133eac70a8a7e97ece9592f7aa496773bbe5509)), closes [#700](https://github.com/stencila/encoda/issues/700)

## [0.99.10](https://github.com/stencila/encoda/compare/v0.99.9...v0.99.10) (2020-09-25)


### Bug Fixes

* **dependencies:** update dependency @stencila/schema to ^0.46.2 ([bbe1b7a](https://github.com/stencila/encoda/commit/bbe1b7a2d5703c27fec08622a50d53e931f72c87))
* **dependencies:** update dependency fp-ts to ^2.8.3 ([8a72259](https://github.com/stencila/encoda/commit/8a72259c9eaa3171182698f2b1f51c469b8db457))
* **dependencies:** update dependency keyv to ^4.0.3 ([1f3c9e3](https://github.com/stencila/encoda/commit/1f3c9e3331d8409a9207ebbe833e5b223c96dd6d))

## [0.99.9](https://github.com/stencila/encoda/compare/v0.99.8...v0.99.9) (2020-09-24)


### Bug Fixes

* **dependencies:** update dependency @stencila/schema to ^0.46.0 ([aa4662b](https://github.com/stencila/encoda/commit/aa4662b6bd81f62d5897c9f2955eee4ff0d27b5b))
* **dependencies:** update dependency got to ^11.7.0 ([5ddf172](https://github.com/stencila/encoda/commit/5ddf172f8597b80f01be5665236ae67371e53aaa))
* **dependencies:** update dependency puppeteer to ^5.3.1 ([65c6894](https://github.com/stencila/encoda/commit/65c68943d5d728f42b72d11a2d102d9381860a75))
* **HTML:** Ensure that description is always a paragraph ([3135bee](https://github.com/stencila/encoda/commit/3135bee5dcbe628b109e6b9b7b5030fb3b5e5a79))
* **IPYNB:** Improve handling of metadata ([139d4d2](https://github.com/stencila/encoda/commit/139d4d2b48646b9d3b7b1db90cb6ded967da9a49))
* **IPYNB:** Improve handling of notebook metadata ([cb9ca91](https://github.com/stencila/encoda/commit/cb9ca917662eb7ea063c6a4ca3d2e258b381b7b6))

## [0.99.8](https://github.com/stencila/encoda/compare/v0.99.7...v0.99.8) (2020-09-17)


### Bug Fixes

* Always coerce when loading or reading ([bc27c39](https://github.com/stencila/encoda/commit/bc27c395b84afd28a9d4766997676a94bc7f333d))
* **Coerce:** Check for null and array ([d2dfb47](https://github.com/stencila/encoda/commit/d2dfb47d89c4ff5ee38d3e2edb8ef2c31ff15f40))
* **Date:** Allow date values to be short ISO strings e.g 2009-01 ([f85eab6](https://github.com/stencila/encoda/commit/f85eab6024a1f347daaf935edd7b89ab2eff3c6b))
* **Deps:** Upgrade Schema ([0f81d53](https://github.com/stencila/encoda/commit/0f81d534073dd8c295865afefcf41b773113938f))
* **GDoc:** Make article title a string if possible ([cb582f6](https://github.com/stencila/encoda/commit/cb582f63cbf902cc40aed4d951e90e0ffb551705))
* **JATS:** Decode title and abstract as simply as possible; encoding of dates ([5d10c83](https://github.com/stencila/encoda/commit/5d10c83c0444f428d318065b2c072c968a8f0bab))
* **Markdown:** Improve handling of  article title and primitives in table cells ([7b732a7](https://github.com/stencila/encoda/commit/7b732a7b0d95eafa7997c851b17ea9e8046ac082))

## [0.99.7](https://github.com/stencila/encoda/compare/v0.99.6...v0.99.7) (2020-09-17)


### Bug Fixes

* **dependencies:** update dependency @stencila/thema to ^2.17.0 ([3b8c4ef](https://github.com/stencila/encoda/commit/3b8c4efbb5db5ad19fe2196bc774c90c4c425357))
* **dependencies:** update dependency ajv to ^6.12.5 ([545e438](https://github.com/stencila/encoda/commit/545e4380b24c65fa33f6b8a6d227dbf88b7ed968))
* **dependencies:** update dependency got to ^11.6.2 ([7e90438](https://github.com/stencila/encoda/commit/7e90438f96b3c6be1fa3a2fcaf8254781fbe9157))
* **dependencies:** update dependency immer to ^7.0.9 ([9f9b2f1](https://github.com/stencila/encoda/commit/9f9b2f1658b45850eed6198803a191ba86c59f1f))
* **dependencies:** update dependency pdf-lib to ^1.11.1 ([a817097](https://github.com/stencila/encoda/commit/a8170975243147ae67586cf7aeefb2623d2b4da8))
* **dependencies:** update dependency puppeteer to ^5.3.0 ([9bd4467](https://github.com/stencila/encoda/commit/9bd44672611455c94f9fbc0d3a9a517e2eafd4b7))
* **dependencies:** update dependency tempy to ^0.7.0 ([d81e76a](https://github.com/stencila/encoda/commit/d81e76a5a164145dfc36c20ba6e5d365cb23d9c2))
* **dependencies:** update dependency xlsx to ^0.16.7 ([ab4963a](https://github.com/stencila/encoda/commit/ab4963a1c07e01f96389ff67d5a192b5ec767267))

## [0.99.6](https://github.com/stencila/encoda/compare/v0.99.5...v0.99.6) (2020-09-11)


### Bug Fixes

* **Deps:** npm audit fix ([2ce84f9](https://github.com/stencila/encoda/commit/2ce84f99c1a9148c85df954e80cfc51e746572b5))
* **JATS:** Correct decoding about, genre and keywords ([eb03d60](https://github.com/stencila/encoda/commit/eb03d609ea5e45c878d5a381aac098c70b485ee5))
* **JATS:** Correct subject decoding ([e67f988](https://github.com/stencila/encoda/commit/e67f988b75cc111dde7e8f6d0088a31715588f11))
* **JATS:** Correct subject decoding ([64dc78d](https://github.com/stencila/encoda/commit/64dc78db60ab33d1ae4f6e504fd4753b0be29153))
* **JATS:** Decoding for article subjects ([35f3da7](https://github.com/stencila/encoda/commit/35f3da7298865e40ecc042b8d08b91ee87d8e13a))
* **JATS:** Decoding types genre and about for subjects ([10ebb90](https://github.com/stencila/encoda/commit/10ebb907244120a9981324beb5abd34ecf1a19f2))
* **JATS:** Small fix regarding package-lock ([e5363db](https://github.com/stencila/encoda/commit/e5363dbc8f72be0f0a2f4dc0f47d08e0d02c19d7))
* **JATS:** Update snapshots ([286bfaa](https://github.com/stencila/encoda/commit/286bfaa5ec8c7290ec7d4baacd999ee72c9071d3))

## [0.99.5](https://github.com/stencila/encoda/compare/v0.99.4...v0.99.5) (2020-09-09)


### Bug Fixes

* **JATS:** Decode table description as an array of block content ([ec9e64b](https://github.com/stencila/encoda/commit/ec9e64b4ddf64f3c4c05dd08e3fd6f3e9e4e14ef))
* **JATS:** Decoding tag table-wrap-foot for table ([bd0ec61](https://github.com/stencila/encoda/commit/bd0ec6196b957a7d3cf6b079083d71cfcc82e371))

## [0.99.4](https://github.com/stencila/encoda/compare/v0.99.3...v0.99.4) (2020-09-09)


### Bug Fixes

* **dependencies:** update dependency @stencila/executa to ^1.14.1 ([211f326](https://github.com/stencila/encoda/commit/211f3268bd86548e4dd3c37fc5b3c22168c03e52))
* **dependencies:** update dependency @stencila/schema to ^0.45.0 ([229dd6e](https://github.com/stencila/encoda/commit/229dd6e80b57266a39a0d10aed2431d3c8e1167e))
* **dependencies:** update dependency got to ^11.6.1 ([3e877a6](https://github.com/stencila/encoda/commit/3e877a640a299eb9462fcd3f0f864baa3d6c42df))

## [0.99.3](https://github.com/stencila/encoda/compare/v0.99.2...v0.99.3) (2020-09-08)


### Bug Fixes

* **R Markdown:** escape right square bracket. ([70121bb](https://github.com/stencila/encoda/commit/70121bb176d6228c42cacad941297340311fa53c)), closes [#671](https://github.com/stencila/encoda/issues/671)

## [0.99.2](https://github.com/stencila/encoda/compare/v0.99.1...v0.99.2) (2020-09-07)


### Bug Fixes

* **R Markdown:** Pass file path along for resolution of bibliography and other auxillary files ([e0af0c6](https://github.com/stencila/encoda/commit/e0af0c66912cba911d4035c972045a7ea886d8b2))

## [0.99.1](https://github.com/stencila/encoda/compare/v0.99.0...v0.99.1) (2020-09-04)


### Bug Fixes

* **dependencies:** update dependency citation-js to ^0.5.0-alpha.7 ([ddbff25](https://github.com/stencila/encoda/commit/ddbff250e5bc51fd6de3f93af150c49689dd2909))
* **Markdown:** Make path to bibliography relative; warn if file does not exist. ([af45826](https://github.com/stencila/encoda/commit/af45826082880d4876dc4ff26873cbeb31863b19)), closes [#635](https://github.com/stencila/encoda/issues/635)
* **Markdown:** Use ensureInlineContentArray rather than filtering for InlineContent ([8f38581](https://github.com/stencila/encoda/commit/8f38581ad39a8a8aeb6531dcb0f6fc9b09d13245))
* **MediaObjects:** Fix resolution of files ([3216874](https://github.com/stencila/encoda/commit/321687415e41f17a1ec6b8e3d6ef0b1bb654d5e7))
* **Pandoc:** Do not assume single block as table content ([4c706a2](https://github.com/stencila/encoda/commit/4c706a22337c77c5127fa98f39aac5c89cdb7bed)), closes [#668](https://github.com/stencila/encoda/issues/668)
* **Pandoc:** Improve handling of Pandoc table header ([1913836](https://github.com/stencila/encoda/commit/1913836f55c543e07c591965cf3d3e78181c6048))

# [0.99.0](https://github.com/stencila/encoda/compare/v0.98.6...v0.99.0) (2020-09-02)


### Bug Fixes

* **CSL:** Encode and decode publisher and URL ([dcc27d0](https://github.com/stencila/encoda/commit/dcc27d0782c94025e327ef46dfc9812e585a3c43))
* **Deps:** Upgrade Schema version ([37d80f5](https://github.com/stencila/encoda/commit/37d80f53de941dc183f15dcc2f07519fe26a6c7c))
* **HTML:** Encode code chunk with label and/or caption as figure ([2203138](https://github.com/stencila/encoda/commit/22031385b70a8a9b0df6f1625ab6e2abd478a14f))
* **JATS:** Better decoding of alternative publication types and organizational authors ([ac9fddb](https://github.com/stencila/encoda/commit/ac9fddb8c8007edcb0399af864fc0b6cfd9ed6ab))
* **JATS:** Decoding for article issue number ([b5937ba](https://github.com/stencila/encoda/commit/b5937ba5fd79904083436c97ebf8979bc3a4dc45))
* **JATS:** Decoding for article issue number if exist ([21aaafc](https://github.com/stencila/encoda/commit/21aaafc874b268cf91661f9b46a5e4e9b7f3fd4d))
* **Markdown:** Decode CodeChunk meta properly ([03ee8c6](https://github.com/stencila/encoda/commit/03ee8c60be170fe133138baeb97d82896360b0fa))
* **Markdown:** Do not require thematic break in table block; more flexible figure/table & caption orders ([49cdc4e](https://github.com/stencila/encoda/commit/49cdc4e47b694102658f1bac9e09021dc41f6a3b))
* **Markdown:** Remove chunkfigure extension; use chunk label and caption ([b5a7f8a](https://github.com/stencila/encoda/commit/b5a7f8a9fefd8ce89f645b4de8635ed669b388eb))
* **MathML:** Replace deprecated constants ([9c7f1e3](https://github.com/stencila/encoda/commit/9c7f1e36febb7b360f442adc6624a54f4c49c6e7))
* **TeX:** Normalize MathML before XSLT to TeX ([7a66590](https://github.com/stencila/encoda/commit/7a665904396e2481f9d7e6f9c2558920a5b422e6))
* **XMD:** Allow for block extensions for chunks, figures & tables ([c17a753](https://github.com/stencila/encoda/commit/c17a753cbe298e973e5afe5dd54e2a1d68167c08))
* **XMD:** Improve handling of code chunk label, fig.cap and other options ([fbb1b6d](https://github.com/stencila/encoda/commit/fbb1b6dc9317530402221c1f3de0dc2b44663506))


### Features

* **MD:** Add ability to encode tables with captions ([c78d6d0](https://github.com/stencila/encoda/commit/c78d6d0c2d942953753864944a84b40e693e377e))
* **MD:** Encode chunkfigure block extensions ([1ef0c9d](https://github.com/stencila/encoda/commit/1ef0c9d52810b54adc02c5bb75dd616a5301482e))
* **MD:** Encode Tables found in chunkfigure block extensions ([2981320](https://github.com/stencila/encoda/commit/298132030d6f17163514a301fbdc81729d869dcd))

## [0.98.6](https://github.com/stencila/encoda/compare/v0.98.5...v0.98.6) (2020-09-01)


### Bug Fixes

* Increase severity of decoding failures; exit CLI on error ([23ab298](https://github.com/stencila/encoda/commit/23ab298523d24fa70d5cb5245d0e1bea0973a4eb)), closes [#662](https://github.com/stencila/encoda/issues/662)
* Increase severity of decoding failures; exit CLI on error ([4a3f7cb](https://github.com/stencila/encoda/commit/4a3f7cba6858e95a1f6d5c2aec178140abdc692d)), closes [#660](https://github.com/stencila/encoda/issues/660)

## [0.98.5](https://github.com/stencila/encoda/compare/v0.98.4...v0.98.5) (2020-08-27)


### Bug Fixes

* **MD:** Store extracted references to a `bibliography` key ([62a4f29](https://github.com/stencila/encoda/commit/62a4f296a96631e04a39bbc4fd9896a2d503a987)), closes [#609](https://github.com/stencila/encoda/issues/609)

## [0.98.4](https://github.com/stencila/encoda/compare/v0.98.3...v0.98.4) (2020-08-27)


### Bug Fixes

* **JATS:** Decoding for article fpage and lpage ([ffaeaf6](https://github.com/stencila/encoda/commit/ffaeaf6616d6569841922526a2226bbed78285b1))

## [0.98.3](https://github.com/stencila/encoda/compare/v0.98.2...v0.98.3) (2020-08-26)


### Bug Fixes

* **dependencies:** update dependency immer to ^7.0.8 ([23b6a17](https://github.com/stencila/encoda/commit/23b6a17850b2a7a59db1256958214a158f6f27ff))
* **dependencies:** update dependency papaparse to ^5.3.0 ([70b6292](https://github.com/stencila/encoda/commit/70b6292c7593c89b16933757c558bae732421a65))
* **dependencies:** update dependency remark-math to v3 ([a318937](https://github.com/stencila/encoda/commit/a3189375133c30dc5e1e2057bf05b749caf4c5eb))
* **HTML:** Fix encoding of missing nomodule attribute ([a754a44](https://github.com/stencila/encoda/commit/a754a448f76790982661c1f958126e7d57b7fd56))
* **JATS:** Decoding table rowspan and colspan ([d45ea03](https://github.com/stencila/encoda/commit/d45ea0366473fa3ece9fb3e9b952002ca1074e03))
* **JATS:** Update snapshot file and minor changes ([40fd470](https://github.com/stencila/encoda/commit/40fd470042c2ed1866a892ff2ad2e4dec33c142d))

## [0.98.2](https://github.com/stencila/encoda/compare/v0.98.1...v0.98.2) (2020-08-25)


### Bug Fixes

* **Deps:** Upgrade deps ([c14bf9a](https://github.com/stencila/encoda/commit/c14bf9afa7f2fb2a72d0073137704e43cb47e970))

## [0.98.1](https://github.com/stencila/encoda/compare/v0.98.0...v0.98.1) (2020-08-17)


### Bug Fixes

* **Cite:** Add space between first author and "and" ([2dfbfcc](https://github.com/stencila/encoda/commit/2dfbfcc41713cd7eec2ebfeeeb4edf542d5cd8a3))
* **JATS:** Improve parsing of years; use data-title if available ([81fa6f8](https://github.com/stencila/encoda/commit/81fa6f8d6ac08590eae80681aa7c588ff3e8aa75))

# [0.98.0](https://github.com/stencila/encoda/compare/v0.97.3...v0.98.0) (2020-08-13)


### Bug Fixes

* **dependencies:** update dependency @stencila/executa to ^1.12.0 ([7347c7a](https://github.com/stencila/encoda/commit/7347c7a8ab6c2323a4791278d8208a3c9ccdf5a5))
* **dependencies:** update dependency @stencila/executa to ^1.13.0 ([e2533ca](https://github.com/stencila/encoda/commit/e2533ca4c85d589f9738c2c77e21bc9f1b7a8963))
* **dependencies:** update dependency @stencila/thema to v2.15.2 ([c308bc2](https://github.com/stencila/encoda/commit/c308bc2a3a83bb18f62cc881084193d573ed0130))
* **dependencies:** update dependency vfile to ^4.2.0 ([09fb62a](https://github.com/stencila/encoda/commit/09fb62a361ee0d41aefe6d8d484563076bc38591))
* **Deps:** npm audit fix ([a741c91](https://github.com/stencila/encoda/commit/a741c915aa94a0c334faad3a52775bc36bc61d3e))
* **Markdown:** Unwrap image; use id from extension properties ([dd3d1ea](https://github.com/stencila/encoda/commit/dd3d1eaec4ca60077b7734261ba7358c3f4bc286))
* **Markdown, YAML:** Updates for updated typing ([d8b5845](https://github.com/stencila/encoda/commit/d8b584571ea10d8f90779bef6d76d44ee7354d49))


### Features

* **Markdown:** Add chunkfigure extension ([5df6858](https://github.com/stencila/encoda/commit/5df6858bc1c107641ad336d0f9c7394a8cc5fade))

## [0.97.3](https://github.com/stencila/encoda/compare/v0.97.2...v0.97.3) (2020-08-04)


### Bug Fixes

* **dependencies:** update dependency @stencila/schema to ^0.43.3 ([7fd2e6f](https://github.com/stencila/encoda/commit/7fd2e6f1f0f415771b0778b9f0a32456890df5d5))
* **dependencies:** update dependency @stencila/thema to v2.15.0 ([0e091b2](https://github.com/stencila/encoda/commit/0e091b259dc1668fc72d4e7af1a3f8d94343a869))
* **dependencies:** update dependency fp-ts to ^2.8.1 ([15c1818](https://github.com/stencila/encoda/commit/15c1818da37c940ccfe24a14bf6cd078f44e7ba7))
* **dependencies:** update dependency got to ^11.5.1 ([509f090](https://github.com/stencila/encoda/commit/509f0900341dc4adf53f5a88586c0fb1f09bb3cf))
* **dependencies:** update dependency jsdom to ^16.3.0 ([8be8800](https://github.com/stencila/encoda/commit/8be8800610a1308d38d222feae2de76ee9fab7de))
* **dependencies:** update dependency puppeteer to ^5.2.1 ([04dd12f](https://github.com/stencila/encoda/commit/04dd12f00b7118bf8069ae1c5a9d493d70fc0b4d))
* **dependencies:** update dependency tempy to ^0.6.0 ([5bf9746](https://github.com/stencila/encoda/commit/5bf9746cf721cd9f07323df91a6acdfb3ca36c31))
* **dependencies:** update dependency unified to ^9.1.0 ([5344d93](https://github.com/stencila/encoda/commit/5344d9371398304497fc9d14997d1dbf833d7cfe))
* **dependencies:** update dependency xlsx to ^0.16.5 ([2c9fe7e](https://github.com/stencila/encoda/commit/2c9fe7ec3d75a7868560fa992865e0a8eb0907a0))
* **dependencies:** update remark monorepo ([da24a01](https://github.com/stencila/encoda/commit/da24a01a04677694829d1f38a80e76fe7f749d44))

## [0.97.2](https://github.com/stencila/encoda/compare/v0.97.1...v0.97.2) (2020-08-04)


### Bug Fixes

* **CSL:** Decode page into pageStart, pageEnd or pagination; use name for Periodical ([9e1bf68](https://github.com/stencila/encoda/commit/9e1bf68d655f3b40dcdf76e65ee11dd4c8841524))
* **CSL:** Only encode the year date part if 1 January ([15f0fe4](https://github.com/stencila/encoda/commit/15f0fe46cabcb7124506b1e3cb7cb0201f347e65))
* **dependencies:** update dependency @stencila/thema to v2.12.0 ([b6f4f28](https://github.com/stencila/encoda/commit/b6f4f2855a7413cafd4f70025da76676f25003f5))
* **dependencies:** update dependency citation-js to ^0.5.0-alpha.6 ([3333677](https://github.com/stencila/encoda/commit/33336771aa6567ed89d6fdd5fe4a701ed715f929))
* **dependencies:** update dependency fp-ts to ^2.7.0 ([bf3bd28](https://github.com/stencila/encoda/commit/bf3bd2899948e66a8b33c0849a110624e3b38bd3))
* **dependencies:** update dependency got to ^11.5.0 ([a93baa1](https://github.com/stencila/encoda/commit/a93baa157c58169b2b1910973e7d30d98e15fe3d))
* **dependencies:** update dependency pdf-lib to ^1.9.0 ([23f2f08](https://github.com/stencila/encoda/commit/23f2f087c535764c0f54f34eb3a3ea8de313c33e))
* **RMD:** Extract bibliography to separate file ([4faad29](https://github.com/stencila/encoda/commit/4faad29ec0e02dcc4a0ff4234d562ab8f4526a2c))

## [0.97.1](https://github.com/stencila/encoda/compare/v0.97.0...v0.97.1) (2020-07-08)


### Bug Fixes

* **dependencies:** update dependency ajv to ^6.12.3 ([245e3bf](https://github.com/stencila/encoda/commit/245e3bfa6ce36582f402e038c8293a6e229609d8))
* **dependencies:** update dependency immer to ^7.0.5 ([784ef8b](https://github.com/stencila/encoda/commit/784ef8b05129efba1d7283742618f1861e527304))
* **dependencies:** update dependency puppeteer to v5 ([a556645](https://github.com/stencila/encoda/commit/a556645a7e624b1e0214560dec9a429aa0f57641))
* **dependencies:** update dependency xlsx to ^0.16.3 ([693aae9](https://github.com/stencila/encoda/commit/693aae9e1d21dd9579ec54a20e009ed7216528e4))

# [0.97.0](https://github.com/stencila/encoda/compare/v0.96.0...v0.97.0) (2020-06-23)


### Features

* **MD:** Encode references in a separate file ([665e959](https://github.com/stencila/encoda/commit/665e959dc9d35bf9eaabdce10aedd03d68677574)), closes [#589](https://github.com/stencila/encoda/issues/589)

# [0.96.0](https://github.com/stencila/encoda/compare/v0.95.0...v0.96.0) (2020-06-18)


### Bug Fixes

* **dependencies:** update dependency fp-ts to ^2.6.6 ([902c9b5](https://github.com/stencila/encoda/commit/902c9b5357d99a1535b43c643d1b120a7b32e959))
* **dependencies:** update dependency immer to v7 ([9f979e6](https://github.com/stencila/encoda/commit/9f979e684e2bc25bc6dc28ef2ebdecc4ca05c204))
* **dependencies:** update dependency jszip to ^3.5.0 ([a667d65](https://github.com/stencila/encoda/commit/a667d65c6310051e4454a8c3be611dbbb79f46b4))
* **dependencies:** update dependency puppeteer to v4 ([dc8d851](https://github.com/stencila/encoda/commit/dc8d851bfc373eaa6257b4895a4bd48d8370d3fd))


### Features

* **MD:** Decode citation node content from MD frontmatter ([9febb4d](https://github.com/stencila/encoda/commit/9febb4dbb39464539eadb691f94a3e671089f60a))
* **XMD:** Decode Bookdown style figure references to Block Extensions ([093eac8](https://github.com/stencila/encoda/commit/093eac85b99da2d59f59feb88454c5212838ac54))

# [0.95.0](https://github.com/stencila/encoda/compare/v0.94.2...v0.95.0) (2020-06-16)


### Features

* **HTML:** Encode the usage of a collection ([6700d86](https://github.com/stencila/encoda/commit/6700d8611ddb6a9906bd02eec887abf5e8bdd4d6))

## [0.94.2](https://github.com/stencila/encoda/compare/v0.94.1...v0.94.2) (2020-06-15)


### Bug Fixes

* **Markdown:** Encode all parts of a figure collection ([34772a2](https://github.com/stencila/encoda/commit/34772a209f21d5f9f0cc3ad4c6dc77fd93121291)), closes [#544](https://github.com/stencila/encoda/issues/544)
* **RMarkdown:** Encode figure captions using a ref ([1953bac](https://github.com/stencila/encoda/commit/1953bac8b9ad43ae5a0fc186d6cfe6781309ee3b)), closes [#590](https://github.com/stencila/encoda/issues/590)

## [0.94.1](https://github.com/stencila/encoda/compare/v0.94.0...v0.94.1) (2020-06-15)


### Bug Fixes

* **CSV:** Update for new papaparse typings ([728a52d](https://github.com/stencila/encoda/commit/728a52d4c4fe7ab46eb05d37d274f658106d0840))
* **dependencies:** update dependency @stencila/thema to v2.10.2 ([601e349](https://github.com/stencila/encoda/commit/601e3497bd4a020ea5bc62bcfee4a2b8b95b3d09))
* **dependencies:** update dependency fp-ts to ^2.6.5 ([033096e](https://github.com/stencila/encoda/commit/033096eb4afac8d09ff12c844b728da05e7ad677))
* **dependencies:** update dependency fs-extra to ^9.0.1 ([c473408](https://github.com/stencila/encoda/commit/c473408b17e9331e04c3384590ed17a9d3231848))
* **dependencies:** update dependency globby to ^11.0.1 ([28ad04b](https://github.com/stencila/encoda/commit/28ad04b591474a5f491f0619dd42744bd649339d))
* **dependencies:** update dependency got to ^11.3.0 ([0c8a115](https://github.com/stencila/encoda/commit/0c8a115d5192b7d33a020f816f61d26ee385380c))
* **dependencies:** update dependency mime to ^2.4.6 ([cc01de9](https://github.com/stencila/encoda/commit/cc01de9ebb8430af5aebd5b4c231dc3ffb633017))
* **dependencies:** update dependency pdf-lib to ^1.7.0 ([3c83cd3](https://github.com/stencila/encoda/commit/3c83cd349d8ee7748971553a283f2ae852c22b97))
* **dependencies:** update dependency puppeteer to ^3.3.0 ([fc92248](https://github.com/stencila/encoda/commit/fc9224864be67ff9b1bb295a7987213094f80bf1))
* **dependencies:** update dependency remark-stringify to ^8.1.0 ([1cc9f62](https://github.com/stencila/encoda/commit/1cc9f62009efe595d0f62cfe307434e3aecc451e))
* **dependencies:** update dependency xlsx to ^0.16.2 ([f532091](https://github.com/stencila/encoda/commit/f532091b51769c1c82c3b25e6c3bc7e5c23590b0))

# [0.94.0](https://github.com/stencila/encoda/compare/v0.93.14...v0.94.0) (2020-05-29)


### Features

* **JATS:** Decode <collab> Article authors as an Org ([6eb2bf9](https://github.com/stencila/encoda/commit/6eb2bf940bfa8bc365feadcf7a0ee7dd11ce475d))
* **MD:** Decode Pandoc style text citations ([2971d58](https://github.com/stencila/encoda/commit/2971d5863675566541d998a7a7f5ca21b8d4102c)), closes [#543](https://github.com/stencila/encoda/issues/543)

## [0.93.14](https://github.com/stencila/encoda/compare/v0.93.13...v0.93.14) (2020-05-27)


### Bug Fixes

* **dependencies:** update dependency fp-ts to ^2.6.2 ([9aebc57](https://github.com/stencila/encoda/commit/9aebc57735743aa8d751f150dc7454686b9cfd4e))
* **dependencies:** update dependency immer to ^6.0.9 ([90f5064](https://github.com/stencila/encoda/commit/90f506461c349ee339e3bca9142c5ff05996d328))

## [0.93.13](https://github.com/stencila/encoda/compare/v0.93.12...v0.93.13) (2020-05-27)


### Bug Fixes

* **Deps:** Update deps ([90bbb74](https://github.com/stencila/encoda/commit/90bbb747322732dae7e4c11ef4f829f0fff4dfc3))
* **Deps:** Upgrade got ([b7dc20a](https://github.com/stencila/encoda/commit/b7dc20ad32c4b0ad8be3815e500c515964f1e801))

## [0.93.12](https://github.com/stencila/encoda/compare/v0.93.11...v0.93.12) (2020-05-27)


### Bug Fixes

* **dependencies:** update dependency @stencila/executa to ^1.11.6 ([92fdd02](https://github.com/stencila/encoda/commit/92fdd020dd7b9af5db3ac70f75ec4a76652a1e8e))
* **dependencies:** update dependency @stencila/schema to ^0.43.1 ([16f0af9](https://github.com/stencila/encoda/commit/16f0af90a2f2dea7781542dde724d967c856913a))

## [0.93.11](https://github.com/stencila/encoda/compare/v0.93.10...v0.93.11) (2020-05-22)


### Bug Fixes

* **dependencies:** update dependency @stencila/executa to ^1.11.5 ([f3eb0a9](https://github.com/stencila/encoda/commit/f3eb0a9cb5e83b0d40caf07668cb29d9c46f0d51))
* **dependencies:** update dependency pdf-lib to ^1.6.0 ([8ac6d0a](https://github.com/stencila/encoda/commit/8ac6d0ac45f7e6ec1d25b54b4f71fb0c3e4e139b))
* **dependencies:** update dependency puppeteer to ^3.1.0 ([bb26c21](https://github.com/stencila/encoda/commit/bb26c215af8522b54d2aad345b26b1a23ba754ce))
* **dependencies:** update dependency vfile to ^4.1.1 ([be4902b](https://github.com/stencila/encoda/commit/be4902b59aec9d136cea463af289de1bcf52689b))
* **dependencies:** update dependency xlsx to ^0.16.1 ([1857d66](https://github.com/stencila/encoda/commit/1857d668094a89aac2e57fa355237aca52d5be2a))
* **Deps:** Change repo for asciimath2tex ([5020b09](https://github.com/stencila/encoda/commit/5020b09a8537bdf14d48b78ab9671fe3c1c4c40a)), closes [#552](https://github.com/stencila/encoda/issues/552)
* **HTML:** Decode thead > tr elements as "rowType: header" nodes ([07b4c89](https://github.com/stencila/encoda/commit/07b4c894bb7b13a734091bacb4b4d32ad9f915ab))
* **HTML:** Encode header TableRows inside a <thead> and cells in <th> ([9629157](https://github.com/stencila/encoda/commit/9629157f8f92d2efeb054a41e41be07a77c3b8a3))
* **JATS:** Decode and encode table headers ([1c661dc](https://github.com/stencila/encoda/commit/1c661dc5b8751aa1a2711dd581f5410396d36197))
* **Pandoc:** Expanded vfile content type ([fda0d13](https://github.com/stencila/encoda/commit/fda0d13b686360a992779d9bbbac86df07617bbb))

## [0.93.10](https://github.com/stencila/encoda/compare/v0.93.9...v0.93.10) (2020-05-19)


### Bug Fixes

* **HTML:** Encode Figure and Table labels and captions. ([33575c5](https://github.com/stencila/encoda/commit/33575c53a127655ebac42eb0e68b1dd8370a1e2d)), closes [#551](https://github.com/stencila/encoda/issues/551)
* **PNG:** Wrap non-creative work nodes ([c20ff08](https://github.com/stencila/encoda/commit/c20ff08f822275257053e18603c3730f87f283f7)), closes [#545](https://github.com/stencila/encoda/issues/545)


### Features

* **Markdown:** Add encoding and decoding of figures [skip release] ([a25626f](https://github.com/stencila/encoda/commit/a25626f238172c2b3326fd1128ca7a90227444d4)), closes [#544](https://github.com/stencila/encoda/issues/544)

## [0.93.9](https://github.com/stencila/encoda/compare/v0.93.8...v0.93.9) (2020-05-18)


### Bug Fixes

* **dependencies:** update dependency @stencila/thema to v2.8.0 ([bff6cf6](https://github.com/stencila/encoda/commit/bff6cf6ecd7381b5b13e72e22c7c2b9c9e98ede8))
* **dependencies:** update dependency async-lock to ^1.2.4 ([e8063a0](https://github.com/stencila/encoda/commit/e8063a09e390ed0f27764df6dfac7bca8db7071a))
* **dependencies:** update dependency fp-ts to ^2.6.1 ([228517f](https://github.com/stencila/encoda/commit/228517febe38dc29b093223dba7404c6cee96417))
* **dependencies:** update dependency get-stdin to v8 ([4dcdd86](https://github.com/stencila/encoda/commit/4dcdd86b6a4a4e3df12bf27db4ab946ca93659c7))
* **dependencies:** update dependency immer to ^6.0.5 ([b324acd](https://github.com/stencila/encoda/commit/b324acdd053fa60765dc6dbf53a3058695a22390))
* **dependencies:** update dependency keyv to ^4.0.1 ([e3ea65d](https://github.com/stencila/encoda/commit/e3ea65dae41b355925c7265d4bc5d989d0f3fa68))
* **dependencies:** update dependency puppeteer to v3 ([d1e7dac](https://github.com/stencila/encoda/commit/d1e7dac06a12b9756a0601811ac6986103f2a9c7))
* **dependencies:** update dependency remark-attr to ^0.11.1 ([6b913bc](https://github.com/stencila/encoda/commit/6b913bc3a7ef008306e6b0a325815b726ca24674))
* **Deps:** Support Node 14; drop support for Node 10 ([417de0c](https://github.com/stencila/encoda/commit/417de0cb4924b395164123dbc1beb4daa3d7c65f))
* **Markdown:** Typing fixes. ([3c662f0](https://github.com/stencila/encoda/commit/3c662f07f65556ec7c44c409a6ff1435d3e4f83b))

## [0.93.8](https://github.com/stencila/encoda/compare/v0.93.7...v0.93.8) (2020-05-05)


### Bug Fixes

* **Build:** Include Tex .xsl files in build ([b04f0a3](https://github.com/stencila/encoda/commit/b04f0a3395034a4902a68bb37d1bbaa2122197d9))
* **dependencies:** update dependency @stencila/executa to ^1.11.2 ([3566bee](https://github.com/stencila/encoda/commit/3566beec6744ae716531a73820975402d2f3d637))
* **dependencies:** update dependency @stencila/logga to ^2.2.0 ([b06aae7](https://github.com/stencila/encoda/commit/b06aae7235561c1965450a97e18ca8ae8e0d8d99))
* **dependencies:** update dependency @stencila/schema to ^0.43.0 ([1151dfc](https://github.com/stencila/encoda/commit/1151dfc6a240c90a11336d19b98d64f666940b4b))
* **dependencies:** update dependency @stencila/thema to v2.7.0 ([33a23cd](https://github.com/stencila/encoda/commit/33a23cdcd57d78c6bfdc583cc19223e6af320ad1))
* **dependencies:** update dependency ajv to ^6.12.2 ([caff592](https://github.com/stencila/encoda/commit/caff592437857084e82b4a352cfd29141d1901f7))
* **dependencies:** update dependency fp-ts to ^2.5.4 ([8c9ba95](https://github.com/stencila/encoda/commit/8c9ba9553edebee6f3f7ea92d79857a5fbd53983))
* **dependencies:** update dependency got to v11 ([972d307](https://github.com/stencila/encoda/commit/972d30700a8b3bec6a7863377da8d8f0193c5302))
* **dependencies:** update dependency jsonld to ^3.1.0 ([b9800cf](https://github.com/stencila/encoda/commit/b9800cfba809ef0a9d9ceea437095810e51544c3))
* **dependencies:** update dependency jszip to ^3.4.0 ([310b2ff](https://github.com/stencila/encoda/commit/310b2ffc15ef388b0ad807d66b434349c6319624))
* **dependencies:** update dependency pdf-lib to ^1.5.0 ([5dd850a](https://github.com/stencila/encoda/commit/5dd850a1a0c6b08fc225dd0cb15a9a301e77e1b8))
* **dependencies:** update dependency remark-parse to ^8.0.2 ([a167688](https://github.com/stencila/encoda/commit/a167688ba680fd80194a9d1b2b3a9e416d2e7f4b))
* **Deps:** Revert to Got v10 ([bba925c](https://github.com/stencila/encoda/commit/bba925c2a01784feae78e3d43a6341e4497965b8))
* **Deps:** Update ([f56bc8e](https://github.com/stencila/encoda/commit/f56bc8e737b817a63a8856aa4794a4b985fc4914))
* **HTTP:** Use new property name ([08b1fec](https://github.com/stencila/encoda/commit/08b1fec07ccae32a00ff199e2d28e351f3542982))

## [0.93.7](https://github.com/stencila/encoda/compare/v0.93.6...v0.93.7) (2020-04-15)


### Bug Fixes

* **Convert function:** By default bundle media content when dumping ([568d18d](https://github.com/stencila/encoda/commit/568d18d231a5b444905cbb0e936796de3769eb8b))
* **dependencies:** update dependency @stencila/thema to v2.2.6 ([eb9c23f](https://github.com/stencila/encoda/commit/eb9c23fc3ba78c4b74d477ba350a0d9d559e2a4e))
* **dependencies:** update dependency js-beautify to ^1.11.0 ([b85f9a1](https://github.com/stencila/encoda/commit/b85f9a11121ac7448160463fbf92c950386addef))
* **dependencies:** update dependency json5 to ^2.1.3 ([355aa41](https://github.com/stencila/encoda/commit/355aa41abfd65dda88248675d07edc9d3b8f7b2e))
* **dependencies:** update dependency jszip to ^3.3.0 ([934f20c](https://github.com/stencila/encoda/commit/934f20c1cb9162e6e9d94d9f6a3fc8dc226a66b4))
* **dependencies:** update dependency papaparse to ^5.2.0 ([b0f0264](https://github.com/stencila/encoda/commit/b0f0264b0d72c4b14612a86a15be58d6a5e1583b))
* **dependencies:** update dependency remark-frontmatter to v2 ([3f19393](https://github.com/stencila/encoda/commit/3f193935ebc565ccf9cf27df0b6a4b279acab5b1))

## [0.93.6](https://github.com/stencila/encoda/compare/v0.93.5...v0.93.6) (2020-04-09)


### Bug Fixes

* **Deps:** Pin to Thema 2.2.1 ([4851ea7](https://github.com/stencila/encoda/commit/4851ea7e1c7a1ccc0ef35cf934f67cd7b4af7d1c))

## [0.93.5](https://github.com/stencila/encoda/compare/v0.93.4...v0.93.5) (2020-04-06)


### Bug Fixes

* **dependencies:** update dependency @stencila/executa to ^1.9.4 ([5d192c8](https://github.com/stencila/encoda/commit/5d192c868de5353c27ff38e2ad90b2af78309de6))
* **dependencies:** update dependency @stencila/thema to v2 ([a168184](https://github.com/stencila/encoda/commit/a16818473572611ada1b7d0d7930979fd42026e9))
* **dependencies:** update dependency datapackage to ^1.1.8 ([771720e](https://github.com/stencila/encoda/commit/771720e5e44a3cc2a35718a902760333a82202bb))
* **dependencies:** update dependency immer to ^6.0.3 ([ef269be](https://github.com/stencila/encoda/commit/ef269be524af01382a350212a9a46b9646845c78))
* **dependencies:** update dependency jsdom to ^16.2.2 ([a09a9b4](https://github.com/stencila/encoda/commit/a09a9b43b9e8129d28856a0604b470e568a5ee5d))
* **dependencies:** update dependency unified to v9 ([9c9c091](https://github.com/stencila/encoda/commit/9c9c09168ee82aa601438a4c6e99ffead3c8eaae))
* **dependencies:** update dependency vfile to ^4.1.0 ([34c3fe7](https://github.com/stencila/encoda/commit/34c3fe734b2b54a3d986c00192292c2f544ab63d))
* **dependencies:** update remark monorepo to v8 ([9a975ec](https://github.com/stencila/encoda/commit/9a975ec00a49a7b82e8ecfb2522a01c05d41d9e9))
* **Deps:** NPM audit fix ([3e82017](https://github.com/stencila/encoda/commit/3e82017fb74bd90d7ee704dcd80d80f80cf7703b))

## [0.93.4](https://github.com/stencila/encoda/compare/v0.93.3...v0.93.4) (2020-04-01)


### Bug Fixes

* **Pandoc:** Avoid loss of already decoded blocks ([c80fd22](https://github.com/stencila/encoda/commit/c80fd2286e4b96c48aeabea8d3310f5d91bbbb67))

## [0.93.3](https://github.com/stencila/encoda/compare/v0.93.2...v0.93.3) (2020-04-01)


### Bug Fixes

* **HTML:** Encode programmingLanguage property for CodeChunks ([77e1d4b](https://github.com/stencila/encoda/commit/77e1d4b5e9f6d57c8ae5e36f372dadb1796d75bc)), closes [#505](https://github.com/stencila/encoda/issues/505)
* **HTML:** Honour isBundle option for media files ([02ea16a](https://github.com/stencila/encoda/commit/02ea16ac61173b4c8a634c5531b8772bb3423ba5))
* **PDF:** Do not show code chunk code ([3ba216d](https://github.com/stencila/encoda/commit/3ba216db9990f7d78beacdc6883cdcbb795d6191))
* **PNG:** Do not disable Javascript ([33152de](https://github.com/stencila/encoda/commit/33152de890eacd2b9de44ec2c6618842954c5a60))

## [0.93.2](https://github.com/stencila/encoda/compare/v0.93.1...v0.93.2) (2020-03-30)


### Bug Fixes

* **Pandoc:** Call encodeCodeChunk in encodeDocumentAsync ([2abd5c3](https://github.com/stencila/encoda/commit/2abd5c3d40639d9c8a92c03306477bb2e243e72c))

## [0.93.1](https://github.com/stencila/encoda/compare/v0.93.0...v0.93.1) (2020-03-26)


### Bug Fixes

* **Deps:** Upgrade Thema to 1.15.2 ([c9947fa](https://github.com/stencila/encoda/commit/c9947fa2a5269d7ae8ea95b0000eda1d091cbe46))
* **PNG, RPNG:** Ensure that images etc are retained before screenshotting ([55172fb](https://github.com/stencila/encoda/commit/55172fb6daf9ca3f4c2b8bc8e4d2393346f5dc56))

# [0.93.0](https://github.com/stencila/encoda/compare/v0.92.0...v0.93.0) (2020-03-25)


### Bug Fixes

* **dependencies:** update dependency @stencila/executa to ^1.9.3 ([2f675ef](https://github.com/stencila/encoda/commit/2f675eff38d688caf153177f016da790edf0b71b))
* **dependencies:** update dependency @stencila/thema to ^1.15.1 ([fa6d666](https://github.com/stencila/encoda/commit/fa6d666d371dae783d02a06432bae4c838fe31db))
* **dependencies:** update dependency fs-extra to v9 ([3502b27](https://github.com/stencila/encoda/commit/3502b27bbc44c1966529b83a4872165e328c94ea))
* **dependencies:** update dependency got to ^10.7.0 ([5ae483a](https://github.com/stencila/encoda/commit/5ae483a3ee2b5add11c5a174c6029e0438758ac3))
* **dependencies:** update dependency immer to ^6.0.2 ([5dfd940](https://github.com/stencila/encoda/commit/5dfd9407ff2c8ef58d3ed4be0f6c2334f4c0e677))
* **dependencies:** update dependency json5 to ^2.1.2 ([822a437](https://github.com/stencila/encoda/commit/822a43763d41a05da6b2521a5815d4947011cdc8))
* **dependencies:** update dependency minimist to ^1.2.5 ([eb5ab09](https://github.com/stencila/encoda/commit/eb5ab096b4051ca66c6ac075ab4019f9715f8ba8))
* **dependencies:** update dependency remark-attr to ^0.10.0 ([56534dc](https://github.com/stencila/encoda/commit/56534dc0a6e531ba2d2f927ef5a96b4d6463f31b))
* **dependencies:** update dependency xlsx to ^0.15.6 ([7d960af](https://github.com/stencila/encoda/commit/7d960afb57a0fb0a89508cbea762f1acf7c2c9c0))
* **dependencies:** update remark monorepo ([2f5fd2b](https://github.com/stencila/encoda/commit/2f5fd2bc71f6b3c833676348d501ed5cd68e25f8))


### Features

* **HTML:** Encode identifiers property ([7704259](https://github.com/stencila/encoda/commit/7704259c9ac01b2c045f88264945539f575ae7b2)), closes [#413](https://github.com/stencila/encoda/issues/413)

# [0.92.0](https://github.com/stencila/encoda/compare/v0.91.0...v0.92.0) (2020-03-23)


### Bug Fixes

* **CSL:** Add handling of PublicationIssue and Periodical ([bb29874](https://github.com/stencila/encoda/commit/bb2987440ab2d22c4f77391958041f1a88f24253))
* **CSL:** Handle pagination properties of an article ([31d7d5e](https://github.com/stencila/encoda/commit/31d7d5ec736c86ba335f479b081a84203b81f58a))
* **dependencies:** update asciimath2tex commit hash to c6f316f ([5878d01](https://github.com/stencila/encoda/commit/5878d01c60a12b14be9b7b5bdb5d0e043f099599))
* **DOCX:** Encode figures and figure goups ([f915d6e](https://github.com/stencila/encoda/commit/f915d6e023f641251156991fd94912d17e1f97bb))
* **DOCX:** Encode table captions; update template ([1cb2b11](https://github.com/stencila/encoda/commit/1cb2b119252b52fa103f65c87625ab4cde054c5a))
* **JATS:** Use table caption property ([58f79df](https://github.com/stencila/encoda/commit/58f79df9cf2bd60c39aaf0d373d7b7ed2d55d1ff))
* **Pandoc:** Encode primitive nodes, improve debug reporting ([e605901](https://github.com/stencila/encoda/commit/e605901fe3d26170e3de2059f0ed1c689af16f7f))
* **Util:** Ensure inline content ([cb5bbfa](https://github.com/stencila/encoda/commit/cb5bbfa3ab252823c5a51b5907ddfa46b99d7746))
* **Util:** Fix copyFile function ([26394d1](https://github.com/stencila/encoda/commit/26394d12fe30ea30b9d56ed5fa3388e1638ddd2c))


### Features

* **Util:** Add resolveFiles function ([70e8934](https://github.com/stencila/encoda/commit/70e893463d2e1b11f5d2bd7edcb8799d872c35e9))

# [0.91.0](https://github.com/stencila/encoda/compare/v0.90.3...v0.91.0) (2020-03-13)


### Bug Fixes

* **HTML:** Add lang attribute to <html> tag ([42dda24](https://github.com/stencila/encoda/commit/42dda2429a976a231c37dfbf27595f9b7ff6837f))
* **HTML:** Do not inject MathJax CSS into page ([c216851](https://github.com/stencila/encoda/commit/c21685173435d92dcc42e8716de68d13c2c080e4))
* **HTML:** Ensure page has one main landmark ([202788c](https://github.com/stencila/encoda/commit/202788c269e9d7d60e671eae3a221f8b2a7a7e6d))
* **HTML:** Improve encoding of headings ([7412caa](https://github.com/stencila/encoda/commit/7412caa6cdf02c96c7aa609fb44e41d379cf5491))
* **HTML:** Only use h1 for article title ([d77c906](https://github.com/stencila/encoda/commit/d77c9060bef918f06b0491ef5b11f00e96734263)), closes [#443](https://github.com/stencila/encoda/issues/443)
* **HTML:** Use a single elem for long titles ([63b2326](https://github.com/stencila/encoda/commit/63b23261d30b5e0f8b1a11ad13556bda023a4ff7))
* **HTML:** Use spans for publisher and logo; avoid duplicate src attribute ([fcadeae](https://github.com/stencila/encoda/commit/fcadeae123f1561c7cf8e50b584bcbe2a119f07c))
* **JATS:** Coerce to inline content instead of filtering it ([9959568](https://github.com/stencila/encoda/commit/99595685da19e13d69b9c18820d14993ae7ca352))
* **JATS:** Decode ids of figure elements ([2173224](https://github.com/stencila/encoda/commit/21732249a3bad77f936c257997c71e93e02328db))
* **JATS:** Decode ids of table elements ([58a4da7](https://github.com/stencila/encoda/commit/58a4da7750570b80e8d01087ae7538c2b9ba1d2a))
* **JATS:** Explicit decoding of supplementary material elements ([3a830bc](https://github.com/stencila/encoda/commit/3a830bc955a0dccec97c91293e0e882ae6208ed4))
* **JATS:** Fix assignment of ids and depths to figure and table titles ([bdde447](https://github.com/stencila/encoda/commit/bdde447b53ec23441a4905a0abbd5ae62a396669))
* **JATS:** Use section + 1 level headings for figs and tables ([c5f7b8e](https://github.com/stencila/encoda/commit/c5f7b8e6933917521c239945b87666368952456c))


### Features

* **HTML:** Allow for no theme and use in tests ([9014d45](https://github.com/stencila/encoda/commit/9014d4514ff05929d6f24eff2fcc3f46038d1a47))
* **HTML:** Encode article pagination details. ([94c7754](https://github.com/stencila/encoda/commit/94c77548b9d514e6ef4e0d5a6ee402aa2ec97727))

## [0.90.3](https://github.com/stencila/encoda/compare/v0.90.2...v0.90.3) (2020-03-12)


### Bug Fixes

* **Dependencies:** Upgrade schema ([460de0e](https://github.com/stencila/encoda/commit/460de0e9d9790d6d2183535aa4c2c1dae6143284))
* **HTML:** Add encoding of Article.isPartOf in references ([b7939e3](https://github.com/stencila/encoda/commit/b7939e38163adee9fce15318bdd987e70698ff08)), closes [#455](https://github.com/stencila/encoda/issues/455)
* **HTML:** Change order that properties of a reference are encoded ([a0521e2](https://github.com/stencila/encoda/commit/a0521e2a0542dd75548c28d3ed118b5d085ca106)), closes [#455](https://github.com/stencila/encoda/issues/455)
* **HTML:** Encode date more concisely ([5bd2995](https://github.com/stencila/encoda/commit/5bd299589ee0662ebf9f8b4cf6aae3a4063df9ac))
* **HTML:** Improve encding of Person names ([f685597](https://github.com/stencila/encoda/commit/f68559732cf5ecec23adf8ea09f39dc4f520bf6a)), closes [#454](https://github.com/stencila/encoda/issues/454)
* **HTML:** remove itemtype and itemscope on inner code element of CodeBlock ([fcd05f3](https://github.com/stencila/encoda/commit/fcd05f3a35d8a66f60354c069a01a7eebb3df2fc)), closes [#434](https://github.com/stencila/encoda/issues/434)
* **JATS:** Improve decoding of references; add fixture ([dc72a94](https://github.com/stencila/encoda/commit/dc72a94aeae766840ca9e428083deb746abb20cb))
* **JATS:** Update encoding of functions for isPartOf property ([0888241](https://github.com/stencila/encoda/commit/08882419f68880777bf1873364e289021e8edea8))
* **Pandoc:** Update Pandoc to 2.9.2 ([92b0ff6](https://github.com/stencila/encoda/commit/92b0ff6ff6ef0ba2e7d43e515ecf2cf55ad8e4c9))

## [0.90.2](https://github.com/stencila/encoda/compare/v0.90.1...v0.90.2) (2020-03-11)


### Bug Fixes

* **Package:** Remove patch-package and use asciimath2tex fork ([8d34518](https://github.com/stencila/encoda/commit/8d3451889280bef9f4631d015c160b5e2e3ac30f))

## [0.90.1](https://github.com/stencila/encoda/compare/v0.90.0...v0.90.1) (2020-03-11)


### Bug Fixes

* **Convert function:** Retain behaviour of returning string if no to path ([2e8a9ea](https://github.com/stencila/encoda/commit/2e8a9eaae0ad38cb2db3991b6de628927c9f2822))
* **dependencies:** update dependency @stencila/executa to ^1.9.2 ([915b562](https://github.com/stencila/encoda/commit/915b562e381f65ce27c6336f5c02b0ae8e59499c))
* **dependencies:** update dependency @stencila/schema to ^0.41.2 ([c60d8fb](https://github.com/stencila/encoda/commit/c60d8fbae4021c0aa9416ce9dce79d6508108345))
* **dependencies:** update dependency @stencila/thema to ^1.14.1 ([80c8353](https://github.com/stencila/encoda/commit/80c8353a16eb3213deaccc2d1f8e4fa9c3c38481))
* **dependencies:** update dependency citation-js to ^0.5.0-alpha.5 ([8e8fc0e](https://github.com/stencila/encoda/commit/8e8fc0ed48eea51bb4aad582ac734d55da5746ac))
* **dependencies:** update dependency jsdom to ^16.2.1 ([05e1be0](https://github.com/stencila/encoda/commit/05e1be071a3e5a56f669ef1ad6e825017df5b5fe))
* **dependencies:** update dependency minimist to ^1.2.3 ([5692dea](https://github.com/stencila/encoda/commit/5692dea00d3ba7b88959c23c462dc8697a98fa62))
* **dependencies:** update dependency patch-package to ^6.2.1 ([5eeddf3](https://github.com/stencila/encoda/commit/5eeddf37b8f6bec3e6d9a39c5882e928be754a5d))
* **dependencies:** update dependency pdf-lib to ^1.4.1 ([6fef1f5](https://github.com/stencila/encoda/commit/6fef1f5fdd82d1cd12f3b94b95bb0d6541af850b))
* **dependencies:** update dependency tempy to ^0.5.0 ([5a8f137](https://github.com/stencila/encoda/commit/5a8f137d4f2bc092ccd265e11d9a81ee7af20366))
* **Dependencies:** Changes to Thema and to-vfile versions ([4a39bbd](https://github.com/stencila/encoda/commit/4a39bbd0b335d184d227471fa789a5fb2e8f2130))
* **JSON-LD:** Upgrade jsonld package and fix tests ([5b0f607](https://github.com/stencila/encoda/commit/5b0f6071c9c1c177222c082c4629079a7b37acbc))
* **Package:** Include patches in package ([62ecf35](https://github.com/stencila/encoda/commit/62ecf35e8824f153cf79a1020ed7970fd29f12e6))
* **Pandoc:** Pass on warnings and do not reject ([5c59927](https://github.com/stencila/encoda/commit/5c5992713487e7239b06505ca528f31179f37ee4))

# [0.90.0](https://github.com/stencila/encoda/compare/v0.89.0...v0.90.0) (2020-03-11)


### Bug Fixes

* **JSON-LD:** Use schema functions for getting context and it's URL ([eaea7a1](https://github.com/stencila/encoda/commit/eaea7a13b14febbac9f012f21c0e4d79bfa251de)), closes [#388](https://github.com/stencila/encoda/issues/388)
* **PNG:** Improve handling of isStandalone flag ([4fe788b](https://github.com/stencila/encoda/commit/4fe788b296ce6245e5c8421e927c33aad98610de))
* **RPNG:** Bundle or self-reference images ([e732a64](https://github.com/stencila/encoda/commit/e732a64a2dd2dfd9673e3f545efdf010b5459af7))
* **RPNG:** Use base64 instead of punycode ([0f4c177](https://github.com/stencila/encoda/commit/0f4c1775969795ef424f9f8e409bb210811bbd22))
* **RPNG:** Use JSON-LD and remove sync functions ([4359cbd](https://github.com/stencila/encoda/commit/4359cbd98d81c31a910998f6fc544df0c74b91c8))
* **RPNG:** Use PNG codec; change keyword ([5e913e4](https://github.com/stencila/encoda/commit/5e913e45d18519931a83e4150cff3e256b179bca))
* **RPNG:** Use zTXt chunks ([48a20c3](https://github.com/stencila/encoda/commit/48a20c3d31b5897d96a69f9358a64b27ba2d4737))


### Features

* **JSON-LD:** Use local copy of Stencila context if possible ([278659c](https://github.com/stencila/encoda/commit/278659c8eeddd37fd0679ab4fa0815b6380d78dc))
* **RPNG:** Add async sniffDecode function ([00179ee](https://github.com/stencila/encoda/commit/00179eec8b1655231774a004ebafc1cb671fdee9))

# [0.89.0](https://github.com/stencila/encoda/compare/v0.88.2...v0.89.0) (2020-03-10)


### Bug Fixes

* Merging and formatting ([9e50fe0](https://github.com/stencila/encoda/commit/9e50fe0c31894119563917c08f7fc177d3ad5edb))
* **DAR:** Specify isStandalone ([87bce99](https://github.com/stencila/encoda/commit/87bce99bd3767c810771bc56257d6b33656b33a8))
* **Dockerfile:** Add package patches to postinstall step ([162ccfa](https://github.com/stencila/encoda/commit/162ccfaf4e5d085e043b395eeac63c01d12a52bb))
* **JATS:** Allow encoding of an article as a fragment ([28b5878](https://github.com/stencila/encoda/commit/28b587815f72a164fc8f7c5e9e72e046f5b2d162)), closes [#178](https://github.com/stencila/encoda/issues/178)
* **JATS:** Encoding of primitives ([46ad634](https://github.com/stencila/encoda/commit/46ad634b477363d4078343c8bd819400043efee7))
* **JATS:** Improve encoding of math nodes ([9d654d0](https://github.com/stencila/encoda/commit/9d654d0798f2a46f7429c40a139e968b98de012e))
* **Markdown:** Add encoding of math nodes ([bc9aca4](https://github.com/stencila/encoda/commit/bc9aca4182c40ed14d1011526491c75641613f0a))
* **Pandoc:** Encode Math nodes usng TeX ([cac6315](https://github.com/stencila/encoda/commit/cac631552acc043d7948eb690332c3adc8c040f2))
* **Pandoc:** Warn if math language is not TeX ([0d1c397](https://github.com/stencila/encoda/commit/0d1c3979988e517edd7196bc48723341470a7d70))
* **TeX:** Allow for namespace ie. <math> and <mml:math> ([3e6a165](https://github.com/stencila/encoda/commit/3e6a1653a99bd1c8c42310b36a1f51df5e6096e9))
* **TeX:** Use pre-compiled mmltex.xsl file ([2bf6aed](https://github.com/stencila/encoda/commit/2bf6aed5d4f583f0e552fb230452da49576c7fc0))
* **XSLT:** Allow for multiple namespaces ([770dff7](https://github.com/stencila/encoda/commit/770dff7263e82f4840240dd50116d0941bd00a34))


### Features

* **Markdown:** Add parsing of math ([a0688bf](https://github.com/stencila/encoda/commit/a0688bffb16f1fbd8d66431c3834042c720f6598)), closes [#27](https://github.com/stencila/encoda/issues/27)
* **MathML:** Add MathML codec ([1323e23](https://github.com/stencila/encoda/commit/1323e23604ef62d0c2c2ccadb688e32d56cc4b82))
* **TeX:** Add TeX codec for converting math nodes ([16d3a8c](https://github.com/stencila/encoda/commit/16d3a8ca98cd0d3df12fa46f959c7343f0cfb8bb))
* **XSLT:** Add XSLT utility module ([63174ae](https://github.com/stencila/encoda/commit/63174ae91a7ddd017166d261f5a2b1dd81664dfb))

## [0.88.2](https://github.com/stencila/encoda/compare/v0.88.1...v0.88.2) (2020-03-06)


### Bug Fixes

* **HTML:** Improve encoding of oranganization; upgrade Microdata encoding ([f24cfc1](https://github.com/stencila/encoda/commit/f24cfc15c431c481a357f81c1b8f7a11e7eac43a))
* **HTML, JATS, GDoc, Pandoc:** Upgrade to new Schema version and make related ListItem changes ([500be23](https://github.com/stencila/encoda/commit/500be23d2a5bc130579988b9c6a9dd4ab9612018)), closes [#306](https://github.com/stencila/encoda/issues/306)
* **JATS:** Fix decoding of affiliation instriutions and address ([fb89241](https://github.com/stencila/encoda/commit/fb89241dfc8581e718a2c0f13209a2c56bb6eb8b)), closes [#458](https://github.com/stencila/encoda/issues/458)

## [0.88.1](https://github.com/stencila/encoda/compare/v0.88.0...v0.88.1) (2020-03-05)


### Bug Fixes

* **dependencies:** update dependency @stencila/executa to ^1.9.1 ([6b4d318](https://github.com/stencila/encoda/commit/6b4d318a0bd7e25627bb5635a9b22430824f666e))
* **dependencies:** update dependency @stencila/thema to ^1.12.0 ([973c908](https://github.com/stencila/encoda/commit/973c908cd3f3cf902a691b24ab08a49c0949a554))
* **dependencies:** update dependency fp-ts to ^2.5.3 ([30bf37e](https://github.com/stencila/encoda/commit/30bf37edb766f81285d4722fc4e6508e84fce2f8))
* **dependencies:** update dependency immer to v6 ([62e1f6e](https://github.com/stencila/encoda/commit/62e1f6e36d77b18dee54be9d725bf3477003504c))
* **dependencies:** update dependency pdf-lib to ^1.4.0 ([faa2585](https://github.com/stencila/encoda/commit/faa25856f08fc8a4e4ccd4c452957889502e358a))
* **dependencies:** update dependency to-vfile to ^6.0.1 ([fe7fb98](https://github.com/stencila/encoda/commit/fe7fb9860531496b88f46f0538ebf488541a6e6c))
* **dependencies:** update dependency vfile to ^4.0.3 ([30f5912](https://github.com/stencila/encoda/commit/30f5912005b918c486eca6a6fc5d7b6b91c3bd92))
* **Dependencies:** Update package-lock.json ([2a0a42b](https://github.com/stencila/encoda/commit/2a0a42b8ff98b385953ae17eca41273c80b72ca1))

# [0.88.0](https://github.com/stencila/encoda/compare/v0.87.0...v0.88.0) (2020-03-03)


### Features

* **HTML:** Encode an array as a fragment ([9190db9](https://github.com/stencila/encoda/commit/9190db9fbc77510c73359b4a53fca9b1977e23a0))
* **Shutdown:** Add top-level shutdown function ([ab04d79](https://github.com/stencila/encoda/commit/ab04d79f323af8f8358021cefa694e4e26be32da))

# [0.87.0](https://github.com/stencila/encoda/compare/v0.86.2...v0.87.0) (2020-03-02)


### Bug Fixes

* **DAR:** Add await and use JATS codec ([c84e87b](https://github.com/stencila/encoda/commit/c84e87b99d4f576816d3c93d58c6b5d1f5da38b6))
* **Dir:** Set output format for files; simplify some code ([d270bad](https://github.com/stencila/encoda/commit/d270bad4c65acf3f53810817ca94781fcc7ad30e))
* **Encoda script:** Format as option ([e24b365](https://github.com/stencila/encoda/commit/e24b365e5357afa5ced0203af904bf4c4d7f177e))
* **HTML:** Add more microdata to list and list item nodes ([468805b](https://github.com/stencila/encoda/commit/468805bffd2788f0d44cf789855d0eb45528196b))
* **Pandoc:** Do not use defaults for authors and title ([fe0eb81](https://github.com/stencila/encoda/commit/fe0eb814ded2f73f46ae3cd9fc9eba73dc17f7d2))
* **XML:** Improve and test error handling ([f5c28b6](https://github.com/stencila/encoda/commit/f5c28b6049dabcaa1207b242f10ea642cdda9742))


### Features

* **Codecs:** Add an isStandalone decode option ([a0d281b](https://github.com/stencila/encoda/commit/a0d281b79d038cb457459e192882e0253975b7bc))
* **Codecs:** Add read and write methods ([618c383](https://github.com/stencila/encoda/commit/618c3835d52ae6b76100509027be36c026b56402))
* **Markdown:** Treat first H1 as title ([bf0eb8a](https://github.com/stencila/encoda/commit/bf0eb8ad0f165c5f110e607aa5e241d36d493508)), closes [#443](https://github.com/stencila/encoda/issues/443)
* **PNG:** Add a PNG codec ([6f900e5](https://github.com/stencila/encoda/commit/6f900e57a8505845f3da993693f030c3825a295c))

## [0.86.2](https://github.com/stencila/encoda/compare/v0.86.1...v0.86.2) (2020-02-26)


### Bug Fixes

* **dependencies:** update dependency @stencila/executa to ^1.9.0 ([73be1ae](https://github.com/stencila/encoda/commit/73be1ae02eb59dc21b2014937e3e4a9ff57ca2fd))
* **dependencies:** update dependency @stencila/logga to ^2.1.0 ([ae28aa1](https://github.com/stencila/encoda/commit/ae28aa1041be8719cb6f3026130bfb7068e102be))
* **dependencies:** update dependency fp-ts to ^2.5.1 ([90d2417](https://github.com/stencila/encoda/commit/90d2417c72552c58933a1bd92a6c62dc2db69934))
* **dependencies:** update dependency github-slugger to ^1.3.0 ([f65b201](https://github.com/stencila/encoda/commit/f65b201538a32b05a918a1a8b0af088cecb2585d))
* **dependencies:** update dependency got to ^10.6.0 ([ab786af](https://github.com/stencila/encoda/commit/ab786af24c73bf53ae20114fe0f55b1cd87d111c))
* **dependencies:** update dependency js-beautify to ^1.10.3 ([260b992](https://github.com/stencila/encoda/commit/260b992f04f859045b43738d5947051cb3d6924a))
* **dependencies:** update dependency js-yaml to ^3.13.1 ([31fed08](https://github.com/stencila/encoda/commit/31fed08732826d8e3c9a6b330b1409a07aca92c8))
* **dependencies:** update dependency jsdom to ^16.2.0 ([766a08e](https://github.com/stencila/encoda/commit/766a08e65da5dad25fefb0b3018f07f261b99f9e))
* **dependencies:** update dependency jsonld to ^2.0.2 ([2ab3a07](https://github.com/stencila/encoda/commit/2ab3a070a99a334ff64f006a994a15faa18960b0))
* **dependencies:** update dependency mdast-util-compact to ^2.0.1 ([a4f6408](https://github.com/stencila/encoda/commit/a4f6408767d5e87e927938d943c7f02fe670ac3e))
* **Dependencies:** Update several prod deps ([e008fda](https://github.com/stencila/encoda/commit/e008fdaef36c94429f2b7024548b03e93da64807))

## [0.86.1](https://github.com/stencila/encoda/compare/v0.86.0...v0.86.1) (2020-02-24)


### Bug Fixes

* **Dependencies:** Upgrade to Schema v0.39 ([21238bc](https://github.com/stencila/encoda/commit/21238bc24dbbadf99a7c80cbd361e7b58dba5dba))
* **HTML:** Add data-itemscope=root to top level node ([2859e32](https://github.com/stencila/encoda/commit/2859e329345b6d0b6f572d64f8bd8cacf3637fc4))
* **IPYNB:** Check for undefined validator again ([f539d15](https://github.com/stencila/encoda/commit/f539d1566d854008bf1018e2eae4d49d40d5d62c))
* **Types:** Use new node types for primitives ([56895b8](https://github.com/stencila/encoda/commit/56895b88b483954cbad661b3fbdc62497b8652c3))

# [0.86.0](https://github.com/stencila/encoda/compare/v0.85.3...v0.86.0) (2020-02-19)


### Bug Fixes

* **deps:** update dependency tempy to ^0.4.0 ([468864c](https://github.com/stencila/encoda/commit/468864c08aa2b2a559ff1977853c92101b5634da))
* **Puppeteer:** Use sync function ([cfb8241](https://github.com/stencila/encoda/commit/cfb824128af2311fc1653949a0648df9db20af48))


### Features

* **Puppeteer:** Check that executable exists ([45be5b1](https://github.com/stencila/encoda/commit/45be5b1c17b36423832c7f58401becca01e482a6))

## [0.85.3](https://github.com/stencila/encoda/compare/v0.85.2...v0.85.3) (2020-02-12)


### Bug Fixes

* **HTML:** Use data-itemtype on created elements; ensure itemprop at right level ([356b8e0](https://github.com/stencila/encoda/commit/356b8e08f71880f12236bac7b0bcb2c272f4f60b))
* **HTML:** Use the correct MathJax format for math fragments ([9750613](https://github.com/stencila/encoda/commit/97506132b2a2cb986ad96cd6bdce464638793196))
* **stringifyContent:** Reduce noise ([d028152](https://github.com/stencila/encoda/commit/d02815297258b28bced09db6213372fd7335c8dc)), closes [#428](https://github.com/stencila/encoda/issues/428)

## [0.85.2](https://github.com/stencila/encoda/compare/v0.85.1...v0.85.2) (2020-02-06)


### Bug Fixes

* **deps:** update dependency @stencila/schema to ^0.37.0 ([778cc1b](https://github.com/stencila/encoda/commit/778cc1b96e29d8c74d207f510b1f92ca9a97d91c))

## [0.85.1](https://github.com/stencila/encoda/compare/v0.85.0...v0.85.1) (2020-02-05)


### Bug Fixes

* **Encode:** Return base64 encoded string for Buffer content ([4e32768](https://github.com/stencila/encoda/commit/4e32768cb64a18f1e2f78f87ad2f2b67194c08cc))

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
