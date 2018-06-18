const fs = require('fs')
const memfs = require('memfs')
const mkdirp = require('mkdirp')
const path = require('path')

const Converter = require('./Converter')
const pandoc = require('./helpers/pandoc')

/**
 * A text document converter based on Pandoc
 *
 * This converter is used as a base class for most the the text document converters.
 * For importing, it calls Pandoc to convert from a given format to Pandoc JSON and then
 * converts from Pandoc JSON to an in-memory Exedoc. For exporting, it does the reverse,
 * by conveting an Exedoc to Pandoc JSON and then calling Pandoc to convert Pandoc JSON
 * to a given format.
 *
 * In most cases there is a close correspondence between Pandoc's and Execdoc's
 * representation of document nodes. Exedoc nodes have different names (closer to HTML5)
 * in some cases:
 *
 * Pandoc BulletList == Exedoc UnorderedList
 * Pandoc DefinitionList == Exedoc DescriptionList
 * Pandoc HorizontalRule == Exedoc ThematicBreak
 *
 * See the Pandoc [type defintions](https://github.com/jgm/pandoc-types/blob/1.17.5/Text/Pandoc/Definition.hs)
 * for specification of Pandoc JSON.
 */
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
      'pandoc-api-version': [ 1, 17, 5 ],
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

  /**
   * Import an array of Pandoc `Block`s
   *
   * @param  {Array} blocks An array of Pandoc `Block`s
   * @return {Array}        An array of executable document nodes
   */
  _importBlocks (blocks) {
    return blocks.map(block => this._importBlock(block))
  }

  /**
   * Export an array of Exedoc nodes as Pandoc `Block`s
   *
   * @param  {Array} nodes  An array of Exedoc nodes
   * @return {Array}        An array of Pandoc `Block`s
   */
  _exportBlocks (nodes) {
    return nodes.map(node => this._exportBlock(node))
  }

  /**
   * Import a Pandoc `Block`.
   *
   * This method should do the inverse of `_exportBlock`.
   *
   * See https://github.com/jgm/pandoc-types/blob/1.17.5/Text/Pandoc/Definition.hs#L217
   * for the defintion of a Pandock `Block`
   *
   * @param  {Object} block Pandoc `Block`
   * @return {Object}       Exedoc node
   */
  _importBlock (node) {
    switch (node.t) {
      case 'BlockQuote': return this._importBlockQuote(node)
      case 'BulletList': return this._importBulletList(node)
      case 'CodeBlock': return this._importCodeBlock(node)
      case 'DefinitionList': return this._importDefinitionList(node)
      case 'Div': return this._importDiv(node)
      case 'Header': return this._importHeader(node)
      case 'HorizontalRule': return this._importHorizontalRule(node)
      // case 'LineBlock': return this._importLineBlock(node)
      // case 'Null': return this._importNull(node)
      case 'OrderedList': return this._importOrderedList(node)
      case 'Para': return this._importPara(node)
      case 'Plain': return this._importPlain(node)
      // case 'RawBlock': return this._importRawBlock(node)
      // case 'Table': return this._importTable(node)
      default:
        return {
          type: node.t,
          children: node.c
        }
    }
  }

  /**
   * Export an Exedoc node as a Pandoc `Block`
   *
   * This method should do the inverse of `_importBlock`.
   *
   * @param  {Object} node Exedoc node
   * @return {Object}      Pandoc `Block`
   */
  _exportBlock (node) {
    switch (node.type) {
      case 'BlockQuote': return this._exportBlockQuote(node)
      case 'UnorderedList': return this._exportBulletList(node)
      case 'CodeBlock': return this._exportCodeBlock(node)
      case 'DescriptionList': return this._exportDefinitionList(node)
      case 'Div': return this._exportDiv(node)
      case 'Header': return this._exportHeader(node)
      case 'ThematicBreak': return this._exportHorizontalRule(node)
      // case 'LineBlock': return this._exportLineBlock(node)
      // case 'Null': return this._exportNull(node)
      case 'OrderedList': return this._exportOrderedList(node)
      case 'Para': return this._exportPara(node)
      case 'Plain': return this._exportPlain(node)
      // case 'RawBlock': return this._exportRawBlock(node)
      // case 'Table': return this._exportTable(node)
      default:
        return {
          t: node.type,
          c: node.children
        }
    }
  }

  /**
   * Import a Pandoc `BlockQuote`
   *
   * @param  {Object} node Pandoc `BlockQuote`
   * @return {Object}      Exedoc `BlockQuote`
   */
  _importBlockQuote (node) {
    return {
      type: 'BlockQuote',
      nodes: this._importBlocks(node.c)
    }
  }

  /**
   * Export an Exedoc `BlockQuote` as a Pandoc `BlockQuote`
   *
   * @param  {Object} node Exedoc `BlockQuote`
   * @return {Object}      Pandoc `BlockQuote`
   */
  _exportBlockQuote (node) {
    return {
      t: 'BlockQuote',
      c: this._exportBlocks(node.nodes)
    }
  }

  /**
   * Import a Pandoc `BulletList` as an Execdoc `UnorderedList`
   *
   * A `BulletList` is constructed as an array of arrays of blocks:
   *
   * `BulletList [[Block]]  -- ^ Bullet list (list of items, each a list of blocks)`
   *
   * @param  {Object} node Pandoc `BulletList`
   * @return {Object}      Exedoc `UnorderedList`
   */
  _importBulletList (node) {
    return {
      type: 'UnorderedList',
      items: node.c.map(array => this._importBlocks(array))
    }
  }

  /**
   * Export an Exedoc `UnorderedList` as a Pandoc `BulletList`
   *
   * @param  {Object} node Exedoc `UnorderedList`
   * @return {Object}      Pandoc `BulletList`
   */
  _exportBulletList (node) {
    return {
      t: 'BulletList',
      c: node.items.map(item => this._exportBlocks(item))
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

  /**
   * Import a Pandoc `DefinitionList` as an Execdoc `DescriptionList`
   *
   *
   * The Pandoc definition of a `DefinitionList` :) is:
   *
   * ```
   * DefinitionList [([Inline],[[Block]])]  -- ^ Definition list
   *                          -- Each list item is a pair consisting of a
   *                          -- term (a list of inlines) and one or more
   *                          -- definitions (each a list of blocks)
   * ```
   *
   * @param  {Object} node Pandoc `DefinitionList`
   * @return {Object}      Exedoc `DescriptionList`
   */
  _importDefinitionList (node) {
    return {
      type: 'DescriptionList',
      items: node.c.map(item => {
        return {
          term: this._importInlines(item[0]),
          // NOTE: Currently, only importing the first set of blocks. It is not clear if Pandoc
          // ever supplied for than one set of blocks
          desc: this._importBlocks(item[1][0])
        }
      })
    }
  }

  /**
   * Export an Exedoc `DescriptionList` as a Pandoc `DefinitionList`
   *
   * @param  {Object} node Exedoc `DescriptionList`
   * @return {Object}      Pandoc `DefinitionList`
   */
  _exportDefinitionList (node) {
    return {
      t: 'DefinitionList',
      c: node.items.map(item => {
        return [
          this._exportInlines(item.term),
          [this._exportBlocks(item.desc)]
        ]
      })
    }
  }

  /**
   * Import a Pandoc `HorizontalRule` as an Execdoc `ThematicBreak`
   *
   * @param  {Object} node Pandoc `HorizontalRule`
   * @return {Object}      Exedoc `ThematicBreak`
   */
  _importHorizontalRule (node) {
    return {
      type: 'ThematicBreak'
    }
  }

  /**
   * Export an Exedoc `ThematicBreak` as a Pandoc `HorizontalRule`
   *
   * @param  {Object} node Exedoc `ThematicBreak`
   * @return {Object}      Pandoc `HorizontalRule`
   */
  _exportHorizontalRule (node) {
    return {
      t: 'HorizontalRule'
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

  /**
   * Import a Pandoc `OrderedList` as an Execdoc `OrderedList`
   *
   * An `OrderedList` is constructed with a set of list attributes and an [array of arrays of blocks]:
   *
   * ```
   * OrderedList ListAttributes [[Block]] -- ^ Ordered list (attributes and a list of items, each a list of blocks)
   * ListAttributes = (Int, ListNumberStyle, ListNumberDelim)
   * ```
   *
   * @param  {Object} node Pandoc `OrderedList`
   * @return {Object}      Exedoc `OrderedList`
   */
  _importOrderedList (node) {
    return {
      type: 'OrderedList',
      index: node.c[0][0], // Int
      style: importStyle(node.c[0][1]), // ListNumberStyle
      delim: importDelim(node.c[0][2]), // ListNumberDelim
      items: node.c[1].map(array => this._importBlocks(array)) // [[Block]]
    }

    function importStyle (style) {
      switch (style.t) {
        case 'DefaultStyle': return null
        case 'Example': return 'example'
        case 'Decimal': return 'decimal'
        case 'LowerRoman': return 'lower-roman'
        case 'UpperRoman': return 'upper-roman'
        case 'LowerAlpha': return 'lower-alpha'
        case 'UpperAlpha': return 'upper-alpha'
      }
    }

    function importDelim (delim) {
      switch (delim.t) {
        case 'DefaultDelim': return null
        case 'Period': return 'period'
        case 'OneParen': return 'one-paren'
        case 'TwoParens': return 'two-parens'
      }
    }
  }

  /**
   * Export an Exedoc `OrderedList` as a Pandoc `OrderedList`
   *
   * @param  {Object} node Exedoc `OrderedList`
   * @return {Object}      Pandoc `OrderedList`
   */
  _exportOrderedList (node) {
    return {
      t: 'OrderedList',
      c: [
        [
          node.index,
          exportStyle(node.style),
          exportDelim(node.delim)
        ],
        node.items.map(item => this._exportBlocks(item))
      ]
    }

    function exportStyle (style) {
      switch (style) {
        case null: return {t: 'DefaultStyle'}
        case 'example': return {t: 'Example'}
        case 'decimal': return {t: 'Decimal'}
        case 'lower-roman': return {t: 'LowerRoman'}
        case 'upper-roman': return {t: 'UpperRoman'}
        case 'lower-alpha': return {t: 'LowerAlpha'}
        case 'upper-alpha': return {t: 'UpperAlpha'}
      }
    }

    function exportDelim (delim) {
      switch (delim) {
        case null: return {t: 'DefaultDelim'}
        case 'period': return {t: 'Period'}
        case 'one-paren': return {t: 'OneParen'}
        case 'two-parens': return {t: 'TwoParens'}
      }
    }
  }

  // Para.c = Plain.c = [Para, [Inline]]

  _importPara (node) {
    return {
      type: node.t,
      nodes: this._importInlines(node.c)
    }
  }

  _exportPara (node) {
    return {
      t: node.type,
      c: this._exportInlines(node.nodes)
    }
  }

  _importPlain (node) {
    return {
      type: node.t,
      nodes: this._importInlines(node.c)
    }
  }

  _exportPlain (node) {
    return {
      t: node.type,
      c: this._exportInlines(node.nodes)
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
