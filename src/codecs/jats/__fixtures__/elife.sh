#!/bin/sh

# Article id, defaults to an arbitrary article id
ID=${1:-46327}
# Article version, defaults to v1
VERSION=${2:-v1}

# Get the XML
curl -s https://raw.githubusercontent.com/elifesciences/elife-article-xml/master/articles/elife-$ID-$VERSION.xml -o elife-$ID-$VERSION.xml
# Create a formatted version to improve readability for developers. 
# See [this comment](https://github.com/elifesciences/elife-article-xml/issues/2#issuecomment-467521451) 
# for potential minor problems with this.
xmllint --format elife-$ID-$VERSION.xml > elife-$ID-$VERSION-formatted.xml
# Check that it has a <body> (some don't)
xmllint --xpath 'count(//article/body)' elife-$ID-$VERSION.xml
