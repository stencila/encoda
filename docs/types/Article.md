---
authors: []
---

```json load=simple
{
  "type": "Article",
  "authors": [],
  "content": [
    {
      "type": "Paragraph",
      "content": ["Just a paragraph."]
    }
  ]
}
```

### Microsoft Word

[docx](./article-simple.docx){write=simple}

[foo](./article-complex.md){read=complex}

[foo](./article-complex.yaml){write=complex}

```json5 dump=complex
{
  type: 'Article',
  authors: [],
  content: [
    {
      type: 'Heading',
      depth: 1,
      content: ['Heading 1']
    },
    {
      type: 'Heading',
      depth: 2,
      content: ['Heading 2']
    },
    {
      type: 'Heading',
      depth: 3,
      content: ['Heading 3']
    },
    {
      type: 'Paragraph',
      content: ['Para']
    }
  ]
}
```
