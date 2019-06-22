# `dir`

The `dir` codec decodes a filesystem directory into a `Collection` of `CreativeWork`s. It encodes a `Collection` as directory, with each `CreativeWork` by default being encoded using the `html` codec.

The `dir` codec is useful for publishing a directory of files (possibly of varying file types) as a directory of HTML (e.g. for publishing documentation).
