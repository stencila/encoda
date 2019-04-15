---
authors:
  - type: Person
    familyNames:
      - Bentley
    givenNames:
      - Nokome
    affiliation:
      type: Organization
      name: Stencila
environment:
  type: Environment
  packages:
    - type: Package
      name: r-tidyverse
      version: 1.2.1
---

# Introduction

This example Markdown document includes meta-data in YAML frontmatter.

# Data

The data used was !connect[data.csv](data.csv).

# Methods

Exploratory analysis of the data was performed using the R programming language.

!include(methods.Rmd)
