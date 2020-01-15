# Test fixtures for Pandoc

These tests fixtures are intended to be used with the `pandoc` codec, which by default imports and exports Pandoc JSON. But because no one wants to write Pandoc JSON by hand, this folder contains files in other formats from which Pandoc JSON is generated using `pandoc-json.sh` e.g.

```bash
./pandoc-json.sh cite.md > cite.pandoc.json
```

This provides an easy way to quickly see the structure of the Pandoc JSON that needs to be decoded/encoded by this codec.

Please don't use these "other format" files e.g. `*.md` in the Pandoc tests. Instead prefer adding fixtures to the codec for the "other format" e.g. `md` codec.
