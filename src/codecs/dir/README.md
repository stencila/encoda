# `dir`

The `dir` codec decodes a filesystem directory into a `Collection` of `CreativeWork`s. It encodes a `Collection` as directory, with each `CreativeWork` by default being encoded using the `html` codec.

The `dir` codec is useful for publishing a directory of files (possibly of varying file types) as a directory of HTML (e.g. for publishing documentation).

## Decoding

### Main file

The `main` attribute is a `boolean` indicating if the file is the main file in the directory.

### Node depth

When a directory is decoded, each `CreativeWork` in the node tree is given a `depth` on its `meta` property. This could be used to resolve the root of the tree.

## Encoding

The `dir` codec encodes a `Collection` into a file hierarchy with descendent `Collection`s encoded as directories and other types of `CreativeWork`s encoded as files.

When decoding a node that is a `CreativeWork`, but not a `Collection`, the node is wrapped in a new `Collection` which has the node as its only `part`. When decoding a node that is not a `CreativeWork`, the node is wrapped as the only `content` of a new `CreativeWork` and then wrapped in a new `Collection`.

### `root.json`

During encoding, a `root.json` file is created at the top level containing the JSON encoding of the root `Collection`, including all decendent nodes, but excluding the `content` property of `CreativeWork`s. This file is intended to be used as a site map for the generated file tree.
