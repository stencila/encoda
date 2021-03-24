# Noweb codec

Noweb (`.nw`) is a collection of binaries for literate programming with LaTeX which inspired the more widely used [Sweave](https://en.wikipedia.org/wiki/Sweave) and the `.Rnw` format.

## Supported syntax

This codec build on the `latex` codec so supports all LaTeX syntax that that codec supports. It adds support for Noweb style `CodeChunk`s:

```
<<>>=
// some code here
@
```

Each `CodeChunk` can be given an `id` property:

```
<<someid>>=
plot(data)
@
```

If the `id` ends with a `\.\w+` regex pattern (e.g. `.py`, `.r`) then the letters will be used as the `CodeChunk`'s `programmingLanguage` e.g.

```
<<first.py>>=
import pandas
@
```

For `.Rnw` files all `CodeChunk`s are assumed to have `programmingLanguage: r` unless explicitly overridden.

In Noweb it is possible to declare that a `CodeChunk` is dependant on another `CodeChunk` e.g.

```
<<second.py>>=
<<first.py>>
pandas.read_csv('mydata.csv')
@
```

Currently, this explicit declaration of a dependency between `CodeChunk`s is not supported pending forthcoming work on enabling dependency analysis and reactivity in Stencila documents.


## Installing Noweb

You can install Noweb to get a better idea of how it works.

> 💬 Note: there is a way to install Noweb with Homebrew, but the repositories seem to be out of date and not maintained.

### Pre-requisites:

* MacTeX: downloaded .pkg [here](https://www.wellesley.edu/lts/techsupport/latex/latexmac). This installs LaTeX in `/usr/local/texlive/2018/`.
* CTAN noweb package: download [here](https://www.ctan.org/pkg/noweb) and unzip.
* `noweb.sty`: copy content from [here](https://www.cs.tufts.edu/~nr/toolkit/working/spe/noweb.sty), then save into `noweb.sty` somewhere.

### Installation instructions

Unzip the noweb package, go to `src/`, open `Makefile`, and remove `-ansi` from ``CC`` flag.

Then from `src` still, run the executable script `./awkmake gawk`; this will tell noweb that you're going to use "gawk" rather than "nawk" when parsing text.

In order to compile, do `make boot` and `sudo make all install` from `src`.

Noweb binaries will be installed in `/usr/local/noweb/`. Add this path to your `PATH` environmental variable in `.bashrc` (Linux) or `.bash_profile` (MacOS) if you want.

Then you need to place the LaTeX noweb style (`.sty`) file in the right folder so that your LaTeX binary can use it.
On my machine, I placed it in `/usr/local/texlive/2018/texmf-dist/tex/latex/base`.
Note that after placing this file, you need to call `sudo texhash`. The `texhash` binary will record all the TeX relevant
files into a database that LaTeX then consults when compiling a `.tex` file.

## Testing Noweb

If installation went well, you can go to `/usr/local/noweb/examples/`, and try:

```bash
noweave primes.nw > primes.tex
latex primes.tex
open primes.dvi
```

Alternatively, do `pdflatex primes.tex`, and open the resulting .pdf in whatever viewer you use.

Here's an example of a simple `hello_in_c.nw` file containing C code:

```latex
\section{A C example}

<<hello.c>>=
/*
  <<license>>
*/
#include <stdio.h>

int main(int argc, char *argv[]) {
  printf("Hello World!\n");
  return 0;
}
@

\noindent and that's it.
```

Note how the code chunk is padded by some LaTeX code above and below, but **there is no** LaTeX preamble code, or `\documentclass` or `\begin{document}` or `\end{document}`. All of this is added automatically by _noweave_ binary, as well as code for loading up the Noweb style file `\usepackage{noweb}`.

Now we can weave this `.nw` file into a `.tex` file, compile it, and open the `.pdf`:

```bash
noweave hello_in_c.nw > hello_in_c.tex
latex hello_in_c.tex
pdflatex hello_in_c.tex
open hello_in_c.pdf
```
