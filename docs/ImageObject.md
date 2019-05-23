---
authors:
  - type: Person
    givenNames:
      - Nokome
    familyNames:
      - Bentley
---

# `ImageObject`

## Data interchange formats

### JSON

```json load=image
{
  "type": "ImageObject",
  "contentUrl": "https://example.org/image.png",
  "title": "The image's title",
  "text": "The alternative text for the image"
}
```

### JSON5

```json5 dump=image
{
  type: 'ImageObject',
  contentUrl: 'https://example.org/image.png',
  title: "The image's title",
  text: 'The alternative text for the image'
}
```

### YAML

```yaml dump=image
type: ImageObject
contentUrl: 'https://example.org/image.png'
title: The image's title
text: The alternative text for the image
```

## Authoring formats

### Markdown

```md dump=image
![The alternative text for the image](https://example.org/image.png "The image's title")
```

### Latex

The encoding to LaTeX is lossy because `text` and `title` properties are not encoded:

```latex dump=image
\includegraphics{https://example.org/image.png}

```

### Google Doc

When encoding an `ImageObject` within a Google Doc it represented as an inline object.

```json dump=image to=gdoc
{
  "title": "Untitled",
  "body": {
    "content": [
      {
        "sectionBreak": {}
      },
      {
        "paragraph": {
          "elements": [
            {
              "inlineObjectElement": {
                "inlineObjectId": "kix.inlineobj0"
              }
            }
          ]
        }
      }
    ]
  },
  "lists": {},
  "inlineObjects": {
    "kix.inlineobj0": {
      "inlineObjectProperties": {
        "embeddedObject": {
          "imageProperties": {
            "contentUri": "https://example.org/image.png"
          },
          "title": "The image's title",
          "description": "The alternative text for the image"
        }
      }
    }
  }
}
```

## Publishing formats

### HTML

```html dump=image
<img
  src="https://example.org/image.png"
  title="The image's title"
  alt="The alternative text for the image"
/>
```

### JATS

```xml dump=image to=jats
<graphic mimetype="image" mime-subtype="png" xlink:href="https://example.org/image.png" xlink:title="The image's title" />

```
