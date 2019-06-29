# XMD: RMarkdown and other language variants

"XMarkdown" is our name for RMarkdown-like formats, that is, RMarkdown but extended to language
X, where X includes Python, Javascript, etc. See https://bookdown.org/yihui/rmarkdown/language-engines.html

In RMarkdown, R code is embedded in "code chunks". There are two types of code chunks: inline and block.

## Inline code chunks

An inline code chunk is equivalent to Stencila's `CodeExpr`.
They are declared using Markdown code spans prefixed by the language label e.g.

```markdown
The answer is `r x * y`
```

Inline code chunks are parsed to a `CodeExpr` with `programmingLanguage` and `text`
properties set e.g.

```json
{
  "type": "CodeExpr",
  "programmingLanguage": "r",
  "text": "x * y"
}
```

## Block code chunks

A block code chunks is equivalent to Stencila's `CodeChunk`.
They are declared using Markdown fenced code blocks with attributes starting
with the language label and, optionally, a chunk label and other chunk options e.g.

````markdown
```{r myplot, fig.width=6, fig.height=7}
plot(x,y)
```
````

Here `myplot` is the chunk label and `fig.width=6, fig.height=7` are chunk options.
A list of chunk options, recognized by the RMarkdown rendering engine, Knitr,
is available at http://yihui.name/knitr/options/.

Block code chunks are decoded to a `CodeChunk` with `programmingLanguage` and `text` properties
set. The chunk label, if defined is used for the `name` property and other
options go into the `meta` property e.g.

```json
{
  "type": "CodeChunk",
  "programmingLanguage": "r",
  "name": "myplot",
  "meta": {
    "fig.width": "6",
    "fig.width": "7"
  },
  "text": "plot(x,y)"
}
```
