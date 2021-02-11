# Demo Magic

Codec for [Demo Magic](https://github.com/paxtonhare/demo-magic) script.

> `demo-magic.sh` is a handy shell script that enables you to script
> repeatable demos in a bash environment so you don't have to type as
> you present. Rather than trying to type commands when presenting you
> simply script them and let `demo-magic.sh` run them for you.

This codec encodes a Stencila `Node` (usually an `Article` authored using
Markdown) as a Bash script that uses the `demo-magic.sh` functions to
provide an interactive demo with simulated typing and other features.
It's very useful for recording screencasts for command line applications.

It supports `Heading`, `Paragraph` and `CodeBlock` nodes with `bash` or
`sh` as the `language`.

You can run the generated script using options. Use `-h` for help.
