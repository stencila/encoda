#!/bin/sh

# A little script for generating test fixture in Pandoc JSON
# from files in other formats which are easier to author

../../../../dist/codecs/pandoc/binary/bin/pandoc $1 --to json | jq . | tee $2

