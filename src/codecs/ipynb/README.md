# Jupyter Notebooks

The `ipynb` codec is for decoding and encoding Jupyter Notebook's `nbformat` JSON. Jupyter Notebooks were formally known as IPython Notebooks, and correspondingly, usually having the `ipynb` filename extension.

> This codec is under development. It requires updating to the revised schemas for `CodeChunk`s in the [`execution-engines` branch of `stencila/schema`](https://github.com/stencila/schema/pull/132/files) e.g. addition of `errors` property. See the TODO:s in the code.

## Typings

This codec uses Typescript type definitions for `nbformat` versions `v3` and `v4` that are generated from the `nbformat` JSON schema definitions in the https://github.com/jupyter/nbformat/ repository. See [`nbformat.js`](nbformat.js) for more details.

These type definitions are used to improve type safety when encoding and decoding. We use the type names e.g. `MarkdownCell` in the documentation below.

## Decoding

Prior to decoding the contents of the notebook is validated against the `nbformat` JSON Schema version determined by the `nbformat` property of the notebook. All notebooks are decoded to a `Article`.

### Metadata

The only metadata specified in the `nbformat` JSON schema are `title` and `authors`, although arbitrary metadata can be added to a notebook's `metadata` property. During decoding, a notebook's `title` is mapped directly to the article's `title` property.

In `nbformat v4`, a notebook's `authors` property is an array of `any` type. Users can add an author as a string, or an object with more structured metadata on the author. During, decoding this codec will handle each author, based on the type of data:

- `string`s are decoded by the [`person` codec](../person) into a `Person` node
- `object`s are `coerce()`d to a `Person` node

This allows for some flexibility for users when entering metadata (e.g. using a string instead of an object, using `lastName` instead of `familyName`) while still ensuring that it is consistent with the schema.org vocabulary and Stencila schema. All other data in the notebook's `metadata` is stored in the article's `meta` property.

For example, the following notebook,

```json
{
  "nbformat": 4,
  "nbformat_minor": 4,
  "metadata": {
    "title": "Article title",
    "authors": [
      "Josiah Carberry PhD (http://library.brown.edu/about/hay/carberry.php)",
      "Dr Jane Carberry <jane.carberry@example.org>",
      {
        "firstName": "Janet",
        "lastName": "Carberry",
        "affiliations": {
          "type": "Organization",
          "name": "Brown University"
        },
        "favoriteColour": "red"
      }
    ],
    "arbitrary_metadata": {
      "provider": "Deep Thought",
      "answer": 42
    }
  },
  "cells": []
}
```

is decoded to this `Article` with each author expanded to a `Person` node,

```json
{
  "type": "Article",
  "title": "Article title",
  "authors": [
    {
      "type": "Person",
      "givenNames": ["Josiah"],
      "familyNames": ["Carberry"],
      "honorificSuffix": "PhD",
      "url": "http://library.brown.edu/about/hay/carberry.php"
    },
    {
      "type": "Person",
      "honorificPrefix": "Dr",
      "givenNames": ["Jane"],
      "familyNames": ["Carberry"],
      "emails": ["jane.carberry@example.org"]
    },
    {
      "type": "Person",
      "affiliations": [
        {
          "type": "Organization",
          "name": "Brown University"
        }
      ],
      "familyNames": ["Carberry"],
      "givenNames": ["Janet"]
    }
  ],
  "meta": {
    "arbitrary_metadata": {
      "provider": "Deep Thought",
      "answer": 42
    }
  },
  "content": []
}
```

### Cells

The main content of a Jupyter Notebooks is in the `cells` array. These cells are of different types, the most commonly used types being `MarkdownCell` and `CodeCell`. All cells are decoded to nodes of type `BlockContent` in the `content` property of the `Article`.

#### `MarkdownCell` etc

`MarkdownCell`s are decoding to an array of `BlockContent` nodes e.g. `Heading`, `Paragraph` etc. This is done by simply delegating to the [`md` codec](../md); see there for more details on the Markdown syntax supported. At present, there is no special handling of the Markdown content, although that could be added if there was a need to handle Markdown syntax that was common in Jupyter Notebooks (e.g. variable interpolation using double braces `{{}}`).

In `v3` of the Jupyter Notebook format there are also cells of type `HeadingCell`, and of type `MarkdownCell` with `cell_type` set to `html`. These are decoded in a similar way to standard `MarkdownCells` - by delegating to the `md` and `html` codecs respectively to decode them into `BlockContent` nodes.

#### `CodeCell`

`CodeCell`s are decoded to a `CodeChunk`. The cell's `source` (`input` in `nbformat v3`) simply becomes the chunk's `text`. Properties of a cell that are not directly translatable e.g. `execution_count`, and any other data in the cell's `metadata`, are placed in the chunk's `meta` property.

<!-- TODO: Document how the `chunk.language` is set -->

The decoding of a `CodeCell`'s `outputs` is a little more involved. In both `v3` and `v4` of `nbformat` this is an array of outputs of different types. The type names differ by schema version. In `v4`, they are `ExecuteResult`, `DisplayData`, `Stream` and `Error`.

`ExecuteResult` and `DisplayData` outputs have a `MimeBundle` which provides the output of the code cell as one or more media types. The `ipynb` codec attempts to decode the raw content of a `MimeBundle` into a semantic `Node` in the Stencila schema. This allows outputs to be used in other code chunks, or encoded in other formats.

For instance, if a cell outputs a HTML table then it will be decoded to a `Table` node, which could then later be encoded as a table in Markdown, Microsoft Word or JATS. For example, this `CodeCell` which outputs the head of a Pandas data frame as HTML,

```json
{
  "cell_type": "code",
  "execution_count": 3,
  "metadata": {},
  "source": [
    "df.head()"
  ],
  "outputs": [
    {
      "data": {
        "output_type": "execute_result",
        "text/html": [
          "<div style=\"max-height:1000px;max-width:1500px;overflow:auto;\">\n",
          "<table border=\"1\" class=\"dataframe\">\n",
          "  <thead>\n",
          "    <tr style=\"text-align: right;\">\n",
          "      <th></th>\n",
          "      <th>YEAR</th>\n",
          "      <th>SUNACTIVITY</th>\n",
          "    </tr>\n",
          "  </thead>\n",
          "  <tbody>\n",
          "    <tr>\n",
          "      <td><strong>0</strong></td>\n",
          "      <td> 1700</td>\n",
          "      <td>  5</td>\n",
          "    </tr>\n",
          "    <tr>\n",
```

is decoded into a `CodeChunk` with a `Table` as output,

```json
{
  "type": "CodeChunk",
  "meta": {
    "execution_count": 3
  },
  "text": "df.head()",
  "outputs": [
    {
      "type": "Table",
      "rows": [
        {
          "type": "TableRow",
          "cells": [
```

For image media types (e.g. `image/png`), the content is decoded to an `ImageObject`.
The Python library `matplotlib` is often used in Jupyter Notebooks. When using `matplotlib`, there is usually text output like `<matplotlib.axes.AxesSubplot at 0xada0550>` as an `ExecuteResult` alongside the `DisplayData` containing the actual image. This output is treated as an artifact and is not decoded into a Stencila `Node`. For example, this Jupyter Notebook `CodeCell`,

```json
{
  "cell_type": "code",
  "execution_count": 7,
  "metadata": {},
  "source": [
    "df.plot(x='YEAR', y='SUNACTIVITY', xlim=(1700,2008))"
  ],
  "outputs": [
  {
    "output_type": "execute_result",
    "data": {
      "text/plain": [
        "<matplotlib.axes.AxesSubplot at 0xada0550>"
      ]
    },
    "execution_count": 7,
    "metadata": {},
  },
  {
    "output_type": "display_data",
    "data": {
      "image/png": "iVBORw0KGgoAAAANSUhEUgAAAXYAAAEKCAYAAAAGvn7fAAAABH..."
```

is decoded into this Stencila `CodeChunk` without the `matplotlib` text output:

```json
{
  "type": "CodeChunk",
  "meta": {
    "execution_count": 7
  },
  "text": "df.plot(x='YEAR', y='SUNACTIVITY', xlim=(1700,2008))",
  "outputs": [
    {
      "type": "ImageObject",
      "format": "image/png",
      "contentUrl": "/tmp/ffbd2b7cdabce95b01e1f41834f90604.png"
    }
  ]
}
```

The decoding of all other media types is delegated to other codecs by matching against their registered `mediaTypes` e.g. `text/html` is decoded by the `html` codec. For example, for `text/plain`, the `txt` codec is used which will decode to text to `null`, `boolean` and `number` nodes if possible.

For `Stream` outputs, the output `text` is simply decoded to a `string` node.

<!-- TODO: Document error translation -->

## Encoding

When encoding a Stencila `Node` to a Jupyter Notebook, if it is not an `Article`, then it is wrapped as necessary into an `Article`. Encoding then proceeds as pretty much the inverse of decoding.

The area with the most asymetry between decoding and encoding, and the area with the greatest loss during round trip conversion, is `CodeCell` `outputs`. As explained above, this codec aims to infer a semantic node type from a `MimeBundle` (e.g. a `Table` from HTML) and ignores some content (e.g. `matplotlib` console output). There is no attempt to store either the raw content or the media types. Therefore, during encoding,

- `string` nodes are encoded as the `text` property of `StreamOutput`
- `ImageObject` nodes are encoded as `DisplayData` outputs
- all other nodes are encoded as `ExecuteResult` outputs.

After encoding, the contents of the generated notebook is validated against the `nbformat v4` JSON Schema.
