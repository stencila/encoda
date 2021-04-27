# Demo Magic

Codec for [Demo Magic](https://github.com/paxtonhare/demo-magic) scripts.

> `demo-magic.sh` is a handy shell script that enables you to script
> repeatable demos in a bash environment so you don't have to type as
> you present. Rather than trying to type commands when presenting you
> simply script them and let `demo-magic.sh` run them for you.

This codec encodes a Stencila document (usually an `Article` authored using
Markdown) as a Bash script that uses the `demo-magic.sh` functions to
provide an interactive demo with simulated typing and other features.
It's very useful for recording screencasts for command line applications.

It supports `Heading`, `Paragraph` and `CodeBlock` nodes with `bash` or
`sh` as the language. `CodeBlock`s support the options `pause`, `noexec` and `hidden`.

Use `pause` to specify the number of seconds to wait after some code has been typed. This can be useful when you want to give your screencast viewer time to understand result before progressing the demo. e.g.

````markdown
```bash pause=2
ls -la
```
````

Use `noexec` to display but not execute Bash code. Use `hidden` to execute Bash code that you want to execute but do not want to display in the demo.

The generated script can be run using various options:

```console
> stencila convert demo.md demo.sh --to demo-magic
> ./demo.sh -h

Usage: ./demo.sh [options]

        Where options is one or more of:
        -h      Prints Help text
        -d      Debug mode. Disables simulated typing
        -n      No wait
        -w      Waits max the given amount of seconds before proceeding with demo (e.g. '-w5')
```
