---
authors: []
---

# CodeBlock

```json load=pyblock
{
  "type": "CodeBlock",
  "language": "python",
  "value": "The code"
}
```

````md dump=pyblock
```python
The code
```
````

```html dump=pyblock
<pre><code class="language-python">The code</code></pre>
```

```json load=rblock
{
  "type": "CodeBlock",
  "language": "r",
  "value": "# The code",
  "meta": {
    "lines": "10-15"
  }
}
```

```yaml dump=rblock
type: CodeBlock
language: r
value: '# The code'
meta:
  lines: 10-15
```

```html dump=rblock
<pre data-lines="10-15"><code class="language-r"># The code</code></pre>
```
