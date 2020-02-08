# TeX codec

This codec allows for translating other `mathLanguage`s for `MathBlock` and `MathFragment` nodes (e.g. MathML) to TeX.  It is used by other codecs which require math elements to be in TeX e.g. [`pandoc`](../pandoc).

For AsciiMath to Tex translation it uses [asciimath2tex](https://github.com/christianp/asciimath2tex). For MathML to TeX translation it uses the XSLT stylesheet from [mathconverter](https://github.com/oerpub/mathconverter/).
