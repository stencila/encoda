# `pandoc`

Typescript definitions for Pandoc.

These type definitions are based on the definitions in [`pandoc-types v1.17.5.4`](https://github.com/jgm/pandoc-types/blob/1.17.5.4/Text/Pandoc/Definition.hs). That is the version used in Pandoc v2.7.2.

Most of the comment strings are copy-pasted directly from there.

To check these type definitions are correct with respect to what Pandoc actually consumes and produces it can be useful to test Markdown or HTML snippets at the console like this (`jq` used for ease of viewing output):

```bash
echo 'A "quote"' | ./vendor/bin/pandoc --from markdown --to json | jq .blocks
```

```json
[
{
    "t": "Para",
    "c": [
    {
        "t": "Str",
        "c": "A"
    },
    {
        "t": "Space"
    },
    {
        "t": "Quoted",
        "c": [
...
```
