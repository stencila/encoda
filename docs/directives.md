---
title: Processing directives
---

Certain types of nodes can have processing directives. These directives are handled by the `process` function and either import, export or check document content. They serve a similar purpose as C/C++ preprocessor directives such as `#include` and `#define`.

These directives can be attached to `Code`, `CodeBlock`, `Link` and `ImageObject` nodes.

# Validate

````md validate
```yaml validate
type: 'Datatable'
columns: []
```
````

```md validate
Check out this [example](datatable.yaml){validate} of a datatable.
```

# Import

The `import` directive specifies the name that the content should be imported into the document as. It checks that the content is valid.

```csv import=data
species, height, width
A, 1.2, 2.4
```

[excel.xlsx](excel.xlsx){export=data}

# Include

The `include` directive allows you to include content from another source or format. It decodes the content into a document node that replaces the including node.

For example, here's a YAML `CodeBlock` that defines a `Table` to be included in the embedding document:

````
```yaml include
type: 'Table'
rows:
  - type: 'TableRow'
    cells:
      - type: 'TableCell'
...
```
````

When this code block is processed it gets replaced by the `Table`, like this:

```yaml include
type: 'Table'
rows:
  - type: 'TableRow'
    cells:
      - type: 'TableCell'
        content:
          - Species
      - type: 'TableCell'
        content:
          - Height
      - type: 'TableCell'
        content:
          - Weight
  - type: 'TableRow'
    cells:
      - type: 'TableCell'
        content:
          - A
      - type: 'TableCell'
        content:
          - 1.2
      - type: 'TableCell'
        content:
          - 10.5
```

> Replace this YAML example with a more compact CSV inclusion. Currently that is not working because CSV imports to a `Datatable` which currently does not have a encoding to HTML implemented.

The `include` directive is most useful when applied to links. This allows you to insert content from external files into a document. For example let's use a link to include the Excel file that we `export`ed above:

[Include Excel file](excel.xlsx){include}

> As above, currently not getting rendered.
