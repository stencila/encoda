# A test fixture for the reshape function

Nokome Bentley ^1^

1 Stencila

Keywords: testing, reshaping

# Abstract

This fixture is for testing that the reshape function does what is expected.
See `../__file__snapshots/reshape-1.md` for the reshaped version. We use
Markdown just becuase it's quick and easy to write but this doc could have
been in JSON or YAML.

# Figure, table and chunk captions

The reshape function attempts to combine tables, figures and code chunks and their captions.

## Tables

Table 1. Caption starts with Table number.

|A|B|
|-|-|
|1|2|

The caption can be after e.g.

|A|B|
|-|-|
|3|4|

Table 2. Caption after table

Captions can also be indicated by emphasis or string emphasis e.g.

**Caption for the next table**

|A|B|
|-|-|
|3|4|

## Figures

![](https://example.org/image.png)

Figure 1. Caption after after image

**Caption is above and bold**

![](https://example.org/image.png)

## Chunks

For formats such as Word and Google Docs placing the figure caption outside of the chunk (and image in those cases). Allows users to more conveniently edit them.

chunk:
:::

```r
# Some R code
```
:::

Figure 3. The caption for the code chunk.


## Citations

Remove unnecessary parentheses and brackets around singular parenthetical citations ([@ref]) and \[[@ref]] and citation groups ([@ref1; @ref2]) and \[[@ref1; @ref2]] (these can cause duplication if left). 

Group together citations surrounded by parentheses to avoid them being treated as narrative (@ref) and (@ref1, @ref2) and (@ref1; @ref2, @ref3). Note that true narrative citations e.g. @ref should not be affected.

Detect in paragraph numeric citations like \[1], \[2] (and \[3]) including those referring to a non-existent reference e.g. \[101] but ignoring those in non-string inline content e.g. _\[1]_, `[2]`. Can also deal with groups of numeric citations e.g. \[1,2] and \[2, 3].

Note the need for escaping the leading square bracket because we are in Markdown and they must not be confused with links.

# References

DOI: 10.21105/joss.02693

Danehkar, A., (2020). AtomNeb Python Package, an addendum to AtomNeb: IDL Library for Atomic Data of Ionized Nebulae. Journal of Open Source Software, 5(55), 2797.

Foo and Bar (2003) A non-existent article that should remain a plain text reference.
