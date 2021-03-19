---
title: Article title
authors:
  - givenNames:
      - Jim
      - J
    familyNames:
      - Jones
    type: Person
datePublished:
  value: '2020-03-13'
  type: Date
references:
  - id: ref1
    authors:
      - familyNames:
          - Adams
        givenNames:
          - B
        type: Person
    datePublished: '1990'
    type: Article
  - id: ref2
    authors:
      - familyNames:
          - Smith
        givenNames:
          - T
        type: Person
    datePublished: '1991'
    type: Article
---

# Heading one

## Heading two

### Heading three

A paragraph with _emphasis_, **strong**, ~~delete~~.

A paragraph with [a _rich_ link](https://example.org){attr=foo}.

A paragraph with !quote[quote](https://example.org).

A paragraph with in-text citations with different citation modes. Parenthetical: [@ref1]. Narrative: @ref1. Narrative author only: @ref1. Narrative year only: @ref1. Citation group with prefix and suffix text [e.g.  @ref1; @ref2  and others].

A paragraph with `# code`{lang=python}.

A paragraph with an image ![alt text](https://via.placeholder.com/10 "title").

Paragraph with a !true and a !false.

A paragraph with other data: a !null, a !number(3.14), and a !array(1,2).

> A blockquote

```r
# Some R code
x <- c(1,2)
```

```js
// Some Javascript code
const inc = (n) => n + 1
```

-   One
-   Two
-   Three

1.  First
2.  Second
3.  Third

| A | B | C |
| - | - | - |
| 1 | 2 | 3 |
| 4 | 5 | 6 |

* * *
