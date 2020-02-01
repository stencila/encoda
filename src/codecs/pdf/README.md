# PDF codec

The `pdf` codec allows for decoding and encoding Portable Document Format (PDF) files. When encoding PDFs, to make them reproducible, the XML encoding of the Stencila `Node` is embedded in the PDF's XMP ([Extensible Metadata Platform](https://en.wikipedia.org/wiki/Extensible_Metadata_Platform)) metadata. This allows the entire `Node` to be later extracted from the PDF.

