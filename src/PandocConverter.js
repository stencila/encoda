const fs = require('fs')
const memfs = require('memfs')
const mkdirp = require('mkdirp')
const path = require('path')

const Converter = require('./Converter')
const pandoc = require('./helpers/pandoc')

class PandocConverter extends Converter {
  id () {
    return 'pandoc'
  }

  extensions () {
    return ['pandoc.json']
  }

  options () {
    return {
      from: 'json',

      to: 'json',
      eol: 'native', // Line endings : --eol=crlf|lf|native
      standalone: true
    }
  }

  async import (path, volume = fs, options = {}) {
    options = Object.assign(this.options(), options)

    // Call Pandoc to convert `options.from` format to Pandoc JSON
    let args = [
      '--from', options.from,
      '--to', 'json'
    ]
    if (options.importArgs) args = args.concat(options.importArgs)
    const pathTemp = '/temp.json'
    const volumeTemp = new memfs.Volume()
    await this._callPandoc(path, volume, pathTemp, volumeTemp, args)

    // Read Pandoc JSON from temporary file into a Pandoc document
    const json = await this.readFile(pathTemp, volumeTemp, options)
    const pandoc = JSON.parse(json)

    // Generate an executable document from the Pandoc document
    let doc
    doc = {
      type: 'Document',
      body: this._importBlocks(pandoc.blocks)
    }
    let front = this._importMeta(pandoc.meta)
    if (Object.keys(front).length) doc.front = front

    return doc
  }

  async export (doc, path, volume = fs, options = {}) {
    options = Object.assign(this.options(), options)

    // Generate a Pandoc document from an executable document
    let pandoc = {
      'pandoc-api-version': [ 1, 17, 3 ],
      meta: this._exportMeta(doc.front || {}),
      blocks: this._exportBlocks(doc.body || [])
    }

    // Write to Pandoc document to a temporary file
    const json = JSON.stringify(pandoc, null, '  ')
    const pathTemp = '/temp.json'
    const volumeTemp = new memfs.Volume()
    await this.writeFile(pathTemp, json, volumeTemp, options)

    // Call Pandoc to convert Pandoc JSON to `options.to` format
    let args = [
      '--from', 'json',
      '--to', options.to
    ]
    if (options.eol) args = args.concat(['--eol', options.eol])
    if (options.standalone) {
      args = args.concat(['--standalone'])
      if (options.template) {
        args = args.concat(['--template', options.template])
      }
    }
    if (options.exportArgs) args = args.concat(options.exportArgs)
    await this._callPandoc(pathTemp, volumeTemp, path, volume, args)
  }

  async _callPandoc (pathFrom, volumeFrom, pathTo, volumeTo, args) {
    // If volumeTo is the local filesystem then get pandoc to output
    // to there directly, otherwise write to the (virtual) filesystem
    let output = true
    if (volumeTo === fs) {
      mkdirp(path.dirname(pathTo))
      args = args.concat(['--output', pathTo])
      output = false
    }
    // If volumeFrom is the local filesystem then get pandoc to read
    // from there directly, otherwise read from the (virtual) filesystem
    let content
    if (volumeFrom === fs) {
      args = args.concat([pathFrom])
      content = ''
    } else {
      content = await this.readFile(pathFrom, volumeFrom)
    }

    // Read, spawn, write...
    let result
    try {
      result = await pandoc.spawn(content, args)
    } catch (error) {
      throw new Error(`Error calling Pandoc:\n  message: ${error.message}\n  args: ${args.join(' ')}\n  content: ${content}`)
    }
    if (output) await this.writeFile(pathTo, result, volumeTo)

    return pathTo
  }

  _importMeta (meta) {
    let obj = {}
    for (let [name, value] of Object.entries(meta)) {
      obj[name] = this._importMetaValue(value)
    }
    return obj
  }

  _exportMeta (front) {
    let meta = {}
    for (let [name, value] of Object.entries(front)) {
      meta[name] = this._exportMetaValue(value)
    }
    return meta
  }

  _importMetaValue (value) {
    switch (value.t) {
      case 'MetaMap':
        // MetaMap {String: MetaValue}
        let map = {}
        for (let [name, item] of Object.entries(value.c)) {
          map[name] = this._importMetaValue(item)
        }
        return {
          type: 'Object',
          data: map
        }
      case 'MetaList':
        // MetaList [MetaValue]
        let list = []
        for (let item of value.c) {
          list.push(this._importMetaValue(item))
        }
        return {
          type: 'Array',
          data: list
        }
      case 'MetaBool':
        // MetaBool Bool
        return {
          type: 'Boolean',
          data: value.c
        }
      case 'MetaString':
        // MetaString String
        return this._importStr(value)
      case 'MetaInlines':
        // MetaInlines [Inline]
        return {
          type: 'Para',
          nodes: this._importInlines(value.c)
        }
      case 'MetaBlocks':
        // MetaBlocks [Block]
        return {
          type: 'Div',
          nodes: this._importBlocks(value.c)
        }
    }
  }

  _exportMetaValue (value) {
    switch (value.type) {
      case 'Object':
        // MetaMap {String: MetaValue}
        let map = {}
        for (let [name, item] of Object.entries(value.data)) {
          map[name] = this._exportMetaValue(item)
        }
        return {
          t: 'MetaMap',
          c: map
        }
      case 'Array':
        // MetaList [MetaValue]
        let list = []
        for (let item of value.data) {
          list.push(this._exportMetaValue(item))
        }
        return {
          t: 'MetaList',
          c: list
        }
      case 'Boolean':
        // MetaBool Bool
        return {
          t: 'MetaBool',
          c: value.data
        }
      case 'String':
        // MetaString String
        return this._exportStr(value)
      case 'Para':
        // MetaInlines [Inline]
        return {
          t: 'MetaInlines',
          c: this._exportInlines(value.nodes)
        }
      case 'Div':
        // MetaBlocks [Block]
        return {
          t: 'MetaBlocks',
          c: this._exportBlocks(value.nodes)
        }
    }
  }

  // [Block]

  _importBlocks (nodes) {
    return nodes.map(node => this._importBlock(node))
  }

  _exportBlocks (nodes) {
    return nodes.map(node => this._exportBlock(node))
  }

  /**
   * Import a Pandoc document node by converting it
   * to an executable document node.
   *
   * This method should do the inverse of `_exportBlock`
   *
   *   Plain [Inline]
   *   Para [Inline]
   *   CodeBlock Attr String
   *   RawBlock Format String
   *   BlockQuote [Block]
   *   OrderedList ListAttributes [[Block]]
   *   BulletList [[Block]]
   *   DefinitionList [([Inline], [[Block]])]
   *   Header Int Attr [Inline]
   *   HorizontalRule
   *   Table [Inline] [Alignment] [Double] [TableCell] [[TableCell]]
   *   Div Attr [Block]
   *   Null
   *
   * @param  {Object} node Pandoc document node
   * @return {Object}      Executable document node
   */
  _importBlock (node) {
    switch (node.t) {
      case 'Plain':
      case 'Para':
        return this._importParaEtc(node)
      case 'CodeBlock':
        return this._importCodeBlock(node)
      case 'Div':
        return this._importDiv(node)
      case 'Header':
        return this._importHeader(node)
      default:
        return {
          type: node.t,
          children: node.c
        }
    }
  }

  /**
   * Export an executable document node by converting it
   * to a Pandoc document node.
   *
   * This method should do the inverse of `_importBlock`
   *
   * @param  {Object} node Executable document node
   * @return {Object}      Pandoc document node
   */
  _exportBlock (node) {
    switch (node.type) {
      case 'Plain':
      case 'Para':
        return this._exportParaEtc(node)
      case 'CodeBlock':
        return this._exportCodeBlock(node)
      case 'Div':
        return this._exportDiv(node)
      case 'Header':
        return this._exportHeader(node)
      default:
        return {
          t: node.type,
          c: node.children
        }
    }
  }

  // Para.c = Plain.c = [Para, [Inline]]

  _importParaEtc (node) {
    return {
      type: node.t,
      nodes: this._importInlines(node.c)
    }
  }

  _exportParaEtc (node) {
    return {
      t: node.type,
      c: this._exportInlines(node.nodes)
    }
  }

  // CodeBlock.c = [Attr, String]

  _importCodeBlock (node) {
    return {
      type: 'CodeBlock',
      attrs: this._importAttr(node.c[0]),
      code: node.c[1]
    }
  }

  _exportCodeBlock (node) {
    return {
      t: 'CodeBlock',
      c: [
        this._exportAttr(node.attrs),
        node.code
      ]
    }
  }

  // Div.c = [Attr, [Block]]

  _importDiv (node) {
    return {
      type: 'Div',
      attrs: this._importAttr(node.c[0]),
      nodes: this._importBlocks(node.c[1])
    }
  }

  _exportDiv (node) {
    return {
      t: 'Div',
      c: [
        this._exportAttr(node.attrs),
        this._exportBlocks(node.nodes)
      ]
    }
  }

  // Header.c = [Int, Attr, [Inline]]

  _importHeader (node) {
    return {
      type: 'Header',
      level: node.c[0],
      attrs: this._importAttr(node.c[1]),
      nodes: this._importInlines(node.c[2])
    }
  }

  _exportHeader (node) {
    return {
      t: 'Header',
      c: [
        node.level,
        this._exportAttr(node.attrs),
        this._exportInlines(node.nodes)
      ]
    }
  }

  // [Inline]

  _importInlines (nodes) {
    let inlines = []
    let previous
    let current
    for (let node of nodes) {
      current = this._importInline(node)
      if (previous && previous.type === 'String' && (current.type === 'Space' || current.type === 'String')) {
        if (current.type === 'Space') previous.data += ' '
        else if (current.type === 'String') previous.data += current.data
      } else {
        inlines.push(current)
        previous = current
      }
    }
    return inlines
  }

  _exportInlines (nodes) {
    return nodes.map(node => this._exportInline(node))
  }

  /**
   * Import an `Inline`
   *
   *   Str String
   *   Emph [Inline]
   *   Strong [Inline]
   *   Strikeout [Inline]
   *   Superscript [Inline]
   *   Subscript [Inline]
   *   SmallCaps [Inline]
   *   Quoted QuoteType [Inline]
   *   Cite [Citation] [Inline]
   *   Code Attr String
   *   Space
   *   SoftBreak
   *   LineBreak
   *   Math MathType String
   *   RawInline Format String
   *   Link Attr [Inline] Target
   *   Image Attr [Inline] Target
   *   Note [Block]
   *   Span Attr [Inline]
   *
   * @param  {Object} node Pandoc document node
   * @return {Object}      Executable document node
   */
  _importInline (node) {
    switch (node.t) {
      case 'Str':
        return this._importStr(node)
      case 'Image':
        return this._importImage(node)
      default:
        return {
          type: node.t,
          children: node.c
        }
    }
  }

  _exportInline (node) {
    switch (node.type) {
      case 'String':
        return this._exportStr(node)
      case 'Image':
        return this._exportImage(node)
      default:
        return {
          t: node.type,
          c: node.children
        }
    }
  }

  // Str.c = String

  _importStr (node) {
    return {
      type: 'String',
      data: node.c
    }
  }

  _exportStr (node) {
    return {
      t: 'Str',
      c: node.data
    }
  }

  // Image.c = [Attr, [Inline], Target]

  _importImage (node) {
    return {
      type: 'Image',
      attrs: this._importAttr(node.c[0]),
      nodes: this._importInlines(node.c[1]),
      target: node.c[2]
    }
  }

  _exportImage (node) {
    return {
      t: 'Image',
      c: [
        this._exportAttr(node.attrs),
        this._exportInlines(node.nodes),
        node.target
      ]
    }
  }

  // Attr = [String, [String], [[String, String]]]
  // 0 = id
  // 1 = classes
  // 2 = name,value pairs of other attributes
  //
  // note spelling Attr (without 's') to maintain consistency with Pandoc type definition

  _importAttr (node) {
    let attrs = {}
    if (node[0]) attrs.id = node[0]
    if (node[1].length) attrs.class = node[1].join(' ')
    for (let attr of node[2]) attrs[attr[0]] = attr[1]
    return attrs
  }

  _exportAttr (attrs) {
    let node = ['', [], []]
    if (attrs.id) node[0] = attrs.id
    if (attrs.class) node[1] = attrs.class.split(' ')
    for (let [name, value] of Object.entries(attrs)) {
      if (name !== 'id' && name !== 'class') node[2].push([name, value])
    }
    return node
  }

  // Target = [String, String]

  _importTarget (node) {
    return node
  }

  _exportTarget (node) {
    return node
  }
}

module.exports = PandocConverter
