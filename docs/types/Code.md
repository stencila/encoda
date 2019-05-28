---
authors: []
---

# Code

## JSON

```json import=code
{
  "type": "Code",
  "value": "x * y"
}
```

```json import=pythonCode
{
  "type": "Code",
  "value": "x * y",
  "language": "python"
}
```

## Markdown

```md export=code
`x * y`
```

```md export=pythonCode
`x * y`{language=python}
```

## HTML

```html export=code
<code>x * y</code>
```

```html export=pythonCode
<code class="language-python">x * y</code>
```

## JATS

```xml export=code to=jats
<p><monospace>x * y</monospace></p>

```

```xml export=pythonCode to=jats
<p><code language="python">x * y</code></p>

```
