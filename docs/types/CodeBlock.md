---
authors: []
---

# CodeBlock

## JSON

```json import=pyblock
{
  "type": "CodeBlock",
  "language": "python",
  "value": "The code"
}
```

```json import=rblock
{
  "type": "CodeBlock",
  "language": "r",
  "value": "# The code",
  "meta": {
    "lines": "10-15"
  }
}
```

```json import=importExample
{
  "type": "CodeBlock",
  "language": "json5",
  "value": "{\n  type: 'Person'\n}",
  "meta": {
    "import": "importExample"
  }
}
```

## Markdown

```md export=pyblock
```

```md export=rblock
```

```md export=importExample
```

### HTML

```html export=pyblock equals=pyblock

```

```html export=rblock equals=rblock

```

### JATS

```xml export=pyblock to=jats

```

```xml export=rblock to=jats

```

### Word

[](./pyblock.docx){exportSkip=pyblock}
