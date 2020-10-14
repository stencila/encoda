# Fixtures for testing `gdoc` codec

## Typescript files (`*.ts`)

Typescript files, such as `kitchenSink.ts`, have a a pair of `gdoc` and `node` objects which can be used to test conversion between a GoogleDoc and Stencila nodes.

The `gdoc` objects are missing many styling related properties that
are normally in a GDoc: to keep them to a manageable size, throughout the tree, we've only included the properties that the codec uses.

## GDoc files (`*.gdoc`)

These are JSON files fetched using the GoogleDocs API using the `gapis.js` script (see there for more details). They have all the styling properties that the Typescript fixtures lack. To regenerate these files run `make -B` in this folder (you will need to set up auth credentials first).
