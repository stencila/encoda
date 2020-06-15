---
title: The article title
authors:
  - givenNames:
      - Jane
    familyNames:
      - Jones
    type: Person
datePublished: '2020-04-01'
---

chunk:
:::
```r
x <- 3.14
```
:::

# A heading

An inline code chunk `x * 2.2`{type=expr lang=r}.

Plain inline code `x * 6`.

## Another heading

A block code chunk

chunk:
:::
```r
# A comment
sum(1:10)
```
:::

A block code chunk with name and options

chunk:
:::
```r label=my_plot fig.height=7 fig.width=8
plot(1:10)
```
:::
