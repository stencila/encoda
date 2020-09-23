---
title: Jupyter notebook title
authors:
  - name: A. Jovian
    type: Person
datePublished:
  value: '2020-04-01'
  type: Date
meta:
  kernelspec:
    display_name: Python 3
    language: python
    name: python3
  language_info:
    codemirror_mode:
      name: ipython
      version: 3
    file_extension: .py
    mimetype: text/x-python
    name: python
    nbconvert_exporter: python
    pygments_lexer: ipython3
    version: 3.6.4
  orig_nbformat: 1
---

# Heading 1

A markdown cell with some text.

chunk:
:::
```python execution_count=4
greeting = 'Hello from Python'
```
:::

## Heading 1.1

An other markdown cell.

chunk:
:::
```python execution_count=6
import sys
print(greeting + ' ' + str(sys.version_info[0]))
```

Hello from Python 3
:::
