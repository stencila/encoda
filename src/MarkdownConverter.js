const fs = require('fs')
const memfs = require('memfs')
const yaml = require('js-yaml')
const yamlFront = require('yaml-front-matter')

const PandocConverter = require('./PandocConverter')

class MarkdownConverter extends PandocConverter {
  id () {
    return 'md'
  }

  extensions () {
    return ['md']
  }

  options () {
    return {
      from: 'markdown-auto_identifiers',
      importArgs: [
        // TODO: re-enable this
        // '--filter=pandoc-citeproc' // Use citeproc filter of citation and reference support
      ],

      to: 'markdown',
      template: 'MarkdownTemplate.md',
      exportArgs: [
        '--atx-headers' // Use ATX (#) headers
      ]
    }
  }

  async import (path, volume = fs, options = {}) {
    options = Object.assign(this.options(), options)

    const md = await this.readFile(path, volume)

    // Pre-process any YAML front matter to translate property aliases
    // into their canonical property names
    let front = yamlFront.loadFront(md)

    let author = front.author || front.authors
    if (author) {
      if (Array.isArray(author)) {
        author = author.map(author => {
          if (typeof author === 'string') {
            return {
              'surname': author
            }
          } else {
            return Object.assign(author, {
              'surname': author['surname'] || author['name'],
              'given-names': author['given-names'],
              'aff-id': author['aff-id'] || author['affiliation']
            })
          }
        })
      }
      front.author = author
      if (front.authors) front.authors = undefined
    }

    let orgs = front.orgs || front.organisations
    if (orgs) {
      front.orgs = orgs
      if (front.organisations) front.organisations = undefined
    }

    let content = front.__content
    delete front.__content
    let mdNew = ''
    if (Object.keys(front).length) mdNew += `---\n${yaml.dump(front)}\n---\n\n`
    mdNew += content

    // Convert new Markdown
    const pathTemp = '/temp.md'
    const volumeTemp = new memfs.Volume()
    await this.writeFile(pathTemp, mdNew, volumeTemp)
    return super.import(pathTemp, volumeTemp, options)
  }

  async export (doc, path, volume, options = {}) {
    options = Object.assign(this.options(), options)

    // Convert to Markdown
    const pathTemp = '/temp.md'
    const volumeTemp = new memfs.Volume()
    await super.export(doc, pathTemp, volumeTemp, options)
    let md = await this.readFile('/temp.md', volumeTemp)

    // Post-process the Markdown
    let mdNew = md
    if (options.complete) {
      // MarkdownTemplate.md writes metadata as JSON on the first line
      // so extract that from the content and write as YAML front matter
      const lines = mdNew.split('\n')
      const json = lines[0]
      const content = lines.slice(1).join('\n')
      let front = JSON.parse(json)
      mdNew = `---\n${yaml.dump(front)}---\n\n${content}`
    }

    // Pandoc writes code blocks with a language "class" atribute as
    //   ``` {.py}
    // Where there is only a single class, rewrite to shorthand
    //   ```py
    mdNew = mdNew.replace(/^``` {\.([\w-]+)}$/mg, (match, group1) => {
      return '```' + group1
    })

    // Write to final destination
    return this.writeFile(path, mdNew, volume)
  }
}

module.exports = MarkdownConverter
