---
title: A test fixture for the reshape function
authors:
  - givenNames:
      - Nokome
    familyNames:
      - Bentley
    type: Person
    affiliations:
      - name: Stencila
        type: Organization
keywords:
  - testing
  - reshaping
description:
  - type: Paragraph
    content:
      - >-
        This fixture is for testing that the reshape function does what is
        expected. See 
      - text: ../__file__snapshots/reshape-1.md
        type: CodeFragment
      - ' for the reshaped version. We use Markdown just becuase it''s quick and easy to write but this doc could have been in JSON or YAML.'
references:
  - authors:
      - familyNames:
          - Pruthvi.
        givenNames:
          - Hemanth
        type: Person
    title: >-
      PyAstroPol: A Python package for the instrumental polarization analysis of
      the astronomical optics.
    datePublished:
      value: '2020-11-24'
      type: Date
    isPartOf:
      issueNumber: 55
      isPartOf:
        volumeNumber: 5
        isPartOf:
          name: Journal of Open Source Software
          type: Periodical
        type: PublicationVolume
      type: PublicationIssue
    publisher:
      name: The Open Journal
      type: Organization
    identifiers:
      - name: doi
        propertyID: 'https://registry.identifiers.org/registry/doi'
        value: 10.21105/joss.02693
        type: PropertyValue
    url: 'http://dx.doi.org/10.21105/joss.02693'
    pagination: '2693'
    type: Article
  - authors:
      - familyNames:
          - Danehkar
        givenNames:
          - Ashkbiz
        type: Person
    title: >-
      AtomNeb Python Package, an addendum to AtomNeb: IDL Library for Atomic
      Data of Ionized Nebulae
    datePublished:
      value: '2020-11-24'
      type: Date
    isPartOf:
      issueNumber: 55
      isPartOf:
        volumeNumber: 5
        isPartOf:
          name: Journal of Open Source Software
          type: Periodical
        type: PublicationVolume
      type: PublicationIssue
    publisher:
      name: The Open Journal
      type: Organization
    identifiers:
      - name: doi
        propertyID: 'https://registry.identifiers.org/registry/doi'
        value: 10.21105/joss.02797
        type: PropertyValue
    url: 'http://dx.doi.org/10.21105/joss.02797'
    pagination: '2797'
    type: Article
  - >-
    Foo and Bar (2003) A non-existent article that should remain a plain text
    reference.
---

# Figure, table and chunk captions

The reshape function attempts to combine tables, figures and code chunks and their captions.

## Tables

table: Table 1
:::
Caption starts with Table number.

| A | B |
| - | - |
| 1 | 2 |
:::

The caption can be after e.g.

table: Table 2
:::
Caption after table

| A | B |
| - | - |
| 3 | 4 |
:::

Captions can also be indicated by emphasis or string emphasis e.g.

table:
:::
Caption for the next table

| A | B |
| - | - |
| 3 | 4 |
:::

## Figures

figure: Figure 1
:::
![](https://via.placeholder.com/100)

Caption after after image
:::

figure:
:::
![](https://via.placeholder.com/200)

Caption is above and bold
:::

## Chunks

For formats such as Word and Google Docs placing the figure caption outside of the chunk (and image in those cases). Allows users to more convieiently edit them.

chunk: Figure 3
:::
The caption for the code chunk.

```r
# Some R code
```
:::
