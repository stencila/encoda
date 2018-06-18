const fs = require('fs')
const memfs = require('memfs')

const MarkdownConverter = require('./MarkdownConverter')

/**
A Document converter for XMarkdown.

XMarkdown is our name for RMarkdown-like formats, that is, RMarkdown but extended to language
X, where X includes Python, Javascript, etc.

This is a preliminary implementation and not all of the following conversions are enabled yet.

In RMarkdown, R code is embedded in "code chunks". There are two types of code chunks: inline and block.
In XMarkdown, we allow both inline and block chunks to be defined in various languages using
our usual language labels e.g. ``r``, ``py``, ``js``.

Inline code chunks, equivalent to Stencila's output cells, are declared using Markdown code spans
prefixed by the language label e.g.

    The answer is `r x`

Block code chunks, equivalent to Stencila's code cells, are declared using Markdown fenced code blocks
with attributes prefixed by the language label and, optionally, a chunk label and other options e.g.

    ```{r myplot, fig.width=6, fig.height=7}
    plot(x,y)
    ```

Here ``myplot`` is the chunk label and ```fig.width=6, fig.height=7``` are chunk options.
A list of chunk options, recognised by the RMarkdown rendering enging, Knitr,
is available at http://yihui.name/knitr/options/.

**/
class XMDConverter extends MarkdownConverter {
  async import (pathFrom, pathTo, volumeFrom, volumeTo, options = {}) {
    volumeFrom = volumeFrom || fs
    volumeTo = volumeTo || volumeFrom

    // Preprocess XMarkdown to Markdown
    const xmd = await this.readFile(pathFrom, volumeFrom || fs)
    let md = ''
    let fig
    for (let line of xmd.split('\n')) {
      let match = line.match(/^```\s*{([a-z]+)\s*([^}]*)}/)
      if (match) {
        let language = match[1]
        let options = match[2]

        // If this the chunk has the `fig.cap` option then create a
        // .fig > .caption > .h1 using markdown syntax
        fig = match[2] && match[2].match(/fig\.cap="([^"]*)"/)
        if (fig) {
          // Create wrapping `div.fig` and `div.caption h1`
          const title = fig[1]
          md += `::: {.fig}\n::: {.caption}\n# ${title}\n:::\n`
          // Remove fig.cap from cell options
          options = options.replace(fig[0], '')
          if (options.slice(-1) === ',') options = options.slice(0, -1)
        }

        // Code cells as Pandoc `backtick_code_blocks` with `fenced_code_attributes`
        // to store language and indicate an executable cell
        md += '``` {.' + language + '}\n'
        if (options) {
          // Cell options as a comment line
          md += `${this._comment(language)}: ${options}\n`
        }
      } else if (line.match(/^```/)) {
        md += '```\n'
        // Terminate the figure if currently in one
        if (fig) {
          md += `:::\n`
          fig = null
        }
      } else {
        md += line + '\n'
      }
    }

    const volumeTemp = new memfs.Volume()
    // Use `pathFrom` here instead of some arbitrary filename (which would be possible)
    // to retain `pathTo` generation behaviour of `super.import`
    await this.writeFile(pathFrom, md, volumeTemp)

    // Continue with normal Markdown import
    return super.import(pathFrom, pathTo, volumeTemp, volumeTo, options)
  }

  async export (pathFrom, pathTo, volumeFrom, volumeTo, options = {}) {
    const volumeTemp = new memfs.Volume()
    await super.export(pathFrom, '/temp.md', volumeFrom, volumeTemp, options)

    const md = await this.readFile('/temp.md', volumeTemp)
    let xmd = ''
    let lines = md.split('\n')
    for (let index = 0; index < lines.length; index++) {
      let line = lines[index]
      // Convert Pandoc Markdown code cells to XMarkdown code chunks
      let match = line.match(/^```\s*\{\.([a-z]+)\}/)
      if (match) {
        let language = match[1]
        let spec = '``` {' + language

        let first = lines[index + 1]
        if (first) {
          let comment = this._comment(language)
          let options = first.match(`^${comment}:\\s*(.*)`)
          if (options) {
            spec += ' ' + options[1]
            index += 1
          }
        }
        xmd += spec + '}\n'
      } else {
        xmd += line + '\n'
      }
    }

    return this.writeFile(pathTo, xmd, volumeTo)
  }

  /**
   * Get the short name (code) for a language
   *
   * @param  {string} lang - Languge name
   * @return {string} - Short name of language
   */
  _shortname (lang) {
    lang = lang.toLowerCase()
    return {
      javascript: 'js',
      julia: 'jl',
      python: 'py'
    }[lang] || lang
  }

  /**
   * Get the language comment character(s)
   *
   * @param  {string} lang - Languge name
   * @return {string} - Single line comment character(s)
   */
  _comment (lang) {
    return {
      js: '//',
      sql: '--'
    }[this._shortname(lang)] || '#'
  }
}

module.exports = XMDConverter
