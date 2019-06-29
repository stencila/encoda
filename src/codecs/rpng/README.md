# `rpng`

A codec for Reproducible PNGs (rPNG) files.

This codec decodes from, and encodes to, a rPNG which embeds the Stencila node
into the `tEXt` chunk of the PNG.

This has been implemented here to make use of the HTML converter to
render the results. It currently using Puppetter and so will not work
in the browser. In the future we may use `html2canvas` and `canvas2image` to enable
rPNGs to be [generated in the browser](https://medium.com/@danielsternlicht/capturing-dom-elements-screenshots-server-side-vs-client-side-approaches-6901c706c56f).

See http://www.libpng.org/pub/png/spec/1.2/PNG-Chunks.html#C.Anc-text
