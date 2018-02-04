const fs = require('fs')
const memfs = require('memfs')
const path = require('path')
const tmp = require('tmp')

const DocumentMdConverter = require('./DocumentMdConverter')

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
class DocumentXmdConverter extends DocumentMdConverter {
  import (pathFrom, pathTo, volumeFrom, volumeTo, options = {}) {
    pathTo = pathTo || path.join(tmp.dirSync().name, 'document.jats.xml')
    volumeFrom = volumeFrom || fs
    volumeTo = volumeTo || volumeFrom

    // Preprocess XMarkdown to Markdown
    return this.readFile(pathFrom, volumeFrom).then((xmd) => {
      let md = ''
      for (let line of xmd.split('\n')) {
        let match = line.match(/^```\s*{([a-z]+)\s*(.*)}/)
        if (match) {
          let language = match[1]
          // Code cells as Pandoc `backtick_code_blocks` with `fenced_code_attributes`
          // to store language and indicate an executable cell
          md += '``` {.' + language + ' executable="yes"}\n'
          // Cell options as a comment line
          if (match[2]) md += `${this._comment(language)}: ${match[2]}\n`
        } else {
          md += line + '\n'
        }
      }
      console.log(md)
      const volumeTemp = new memfs.Volume()
      return this.writeFile('/temp.md', md, volumeTemp).then(() => {
        // Continue with normal Markdown import
        return super.import('/temp.md', pathTo, volumeTemp, volumeTo, options)
      })
    })
  }

  export (html) {
    // Covert HTML to Markdown
    let md = super.exportContent(html)
    // Convert Markdown to XMarkdown
    let xmd = ''
    let lines = md.split('\n')
    for (let index = 0; index < lines.length; index++) {
      let line = lines[index]
      // Stencila Markdown code cells to XMarkdown code chunks
      let match = line.match(/^```([a-z]+)/)
      if (match) {
        let language = match[1]
        let comment = this._comment(language)
        let first = lines[index + 1]
        if (first) {
          // Check for shebang on first line
          let shebang = first.match(`^${comment}!\\s*global`)
          if (shebang) {
            let spec = '```{' + language
            index += 1
            // Check for options on second line
            let second = lines[index + 1]
            let options = second.match(`^${comment}:\\s*(.*)`)
            if (options) {
              spec += ' ' + options[1]
              index += 1
            }
            xmd += spec + '}\n'
          }
        }
      } else {
        xmd += line + '\n'
      }
    }
    return xmd
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

module.exports = DocumentXmdConverter
