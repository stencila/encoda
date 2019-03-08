const fs = require('fs')
const memfs = require('memfs')
const mkdirp = require('mkdirp')
const path = require('path')

const Converter = require('./Converter')
const pandoc = require('./helpers/pandoc')

/**
 * A text document converter based on Pandoc
 *
 * This converter is used as a base class for most of the text document converters.
 * For importing, it uses Pandoc to convert from the input format to Pandoc JSON and then
 * converts from Pandoc JSON to an in-memory executable document. For exporting, it does the reverse,
 * by conveting an executable document to Pandoc JSON and then using Pandoc to convert Pandoc JSON
 * to the output format.
 *
 * In most cases there is a close correspondence between the data model for Pandoc's
 * document nodes and those used in executable documents.
 * Executable document nodes have different names (closer to HTML5)
 * in some cases e.g.
 *
 * Pandoc BulletList == Executable document UnorderedList
 * Pandoc DefinitionList == Executable document DescriptionList
 * Pandoc HorizontalRule == Executable document ThematicBreak
 *
 * See the Pandoc [type defintions](https://github.com/jgm/pandoc-types/blob/1.17.5/Text/Pandoc/Definition.hs)
 * for specification of Pandoc types.
 */
class PandocConverter extends Converter {
  id () {
    return 'pandoc'
  }

  extensions () {
    if (this.constructor === PandocConverter) return ['pandoc.json']
    else return super.extensions() // Allow derived classes to use default implem
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

    // If the Pandoc has `meta.references` or `meta.bibliography` then remove any `div#refs`
    // (formatted references) that might be automatically added by Pandoc since a structured
    // reference will be produced from the former.
    if (pandoc.meta.references || pandoc.meta.bibliography) {
      let index = 0
      for (let block of pandoc.blocks) {
        if (block.t === 'Div' && block.c[0][0] === 'refs') {
          pandoc.blocks.splice(index, 1)
        }
        index += 1
      }
    }

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
      '--from=json',
      '--filter=pandoc-citeproc' // Necessary to have output of references
    ]
    if (options.to) args = args.concat(['--to', options.to])
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

  /**
   * Call Pandoc binary to do conversion
   *
   * @param  {String} pathFrom   The input path
   * @param  {Object} volumeFrom The input volume (e.g. `fs`)
   * @param  {String} pathTo     The output path
   * @param  {Object} volumeTo   The output volume (e.g. `fs`)
   * @param  {Array}  args       Array of arguments to call Pandoc with
   * @return {String}            The output path
   */
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

  /** ***************** Meta nodes *******************/

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
        return {
          t: 'String',
          c: value.c
        }
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
        return {
          t: 'MetaString',
          c: value.data
        }
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

  /** ***************** Block nodes *******************/

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
   * Export an array of executable document nodes as Pandoc `Block`s
   *
   * @param  {Array} nodes  An array of executable document nodes
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
   * for the defintion of a Pandoc `Block`
   *
   * @param  {Object} block  Pandoc `Block`
   * @return {Object}        Executable document node
   */
  _importBlock (block) {
    switch (block.t) {
      case 'BlockQuote': return this._importBlockQuote(block)
      case 'BulletList': return this._importBulletList(block)
      case 'CodeBlock': return this._importCodeBlock(block)
      case 'DefinitionList': return this._importDefinitionList(block)
      case 'Div': return this._importDiv(block)
      case 'Header': return this._importHeader(block)
      case 'HorizontalRule': return this._importHorizontalRule(block)
      case 'LineBlock': return this._importLineBlock(block)
      // case 'Null': return this._importNull(block)
      case 'OrderedList': return this._importOrderedList(block)
      case 'Para': return this._importPara(block)
      case 'Plain': return this._importPlain(block)
      case 'RawBlock': return this._importRawBlock(block)
      case 'Table': return this._importTable(block)
      default:
        return {
          type: block.t,
          children: block.c
        }
    }
  }

  /**
   * Export to a Pandoc `Block`
   *
   * This method should do the inverse of `_importBlock`.
   *
   * @param  {Object} node Executable document node
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
      case 'LineBlock': return this._exportLineBlock(node)
      // case 'Null': return this._exportNull(node)
      case 'OrderedList': return this._exportOrderedList(node)
      case 'Para': return this._exportPara(node)
      case 'Plain': return this._exportPlain(node)
      case 'RawBlock': return this._exportRawBlock(node)
      case 'Table': return this._exportTable(node)
      default:
        // Node type which does not exist in Pandoc e.g. `Number`
        // gets wrapped in a `Plain` block...
        return {
          t: 'Plain',
          c: [this._exportDefault(node)]
        }
    }
  }

  /**
   * Import a Pandoc `BlockQuote`
   *
   * @param  {Object} node Pandoc `BlockQuote`
   * @return {Object}      executable document `BlockQuote`
   */
  _importBlockQuote (node) {
    return {
      type: 'BlockQuote',
      nodes: this._importBlocks(node.c)
    }
  }

  /**
   * Export an executable document `BlockQuote` as a Pandoc `BlockQuote`
   *
   * @param  {Object} node executable document `BlockQuote`
   * @return {Object}      Pandoc `BlockQuote`
   */
  _exportBlockQuote (node) {
    return {
      t: 'BlockQuote',
      c: this._exportBlocks(node.nodes)
    }
  }

  /**
   * Import a Pandoc `BulletList` as an executable document `UnorderedList`
   *
   * A `BulletList` is constructed as an array of arrays of blocks:
   *
   * `BulletList [[Block]]  -- ^ Bullet list (list of items, each a list of blocks)`
   *
   * @param  {Object} node Pandoc `BulletList`
   * @return {Object}      executable document `UnorderedList`
   */
  _importBulletList (node) {
    return {
      type: 'UnorderedList',
      items: node.c.map(array => this._importBlocks(array))
    }
  }

  /**
   * Export an executable document `UnorderedList` as a Pandoc `BulletList`
   *
   * @param  {Object} node executable document `UnorderedList`
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
   * Import a Pandoc `DefinitionList` as an executable document `DescriptionList`
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
   * @return {Object}      executable document `DescriptionList`
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
   * Export an executable document `DescriptionList` as a Pandoc `DefinitionList`
   *
   * @param  {Object} node executable document `DescriptionList`
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
   * Import a Pandoc `HorizontalRule` as an executable document `ThematicBreak`
   *
   * @param  {Object} node Pandoc `HorizontalRule`
   * @return {Object}      executable document `ThematicBreak`
   */
  _importHorizontalRule (node) {
    return {
      type: 'ThematicBreak'
    }
  }

  /**
   * Export an executable document `ThematicBreak` as a Pandoc `HorizontalRule`
   *
   * @param  {Object} node executable document `ThematicBreak`
   * @return {Object}      Pandoc `HorizontalRule`
   */
  _exportHorizontalRule (node) {
    return {
      t: 'HorizontalRule'
    }
  }

  /**
   * Import a Pandoc `LineBlock` as an executable document `LineBlock`
   *
   * The Pandoc definition of a `LineBlock` is:
   *
   * ```
   * LineBlock [[Inline]]  -- ^ Multiple non-breaking lines
   * ```
   *
   * @param  {Object} node Pandoc `LineBlock`
   * @return {Object}      executable document `LineBlock`
   */
  _importLineBlock (node) {
    return {
      type: 'LineBlock',
      lines: node.c.map(line => this._importInlines(line))
    }
  }

  /**
   * Export an executable document `LineBlock` as a Pandoc `LineBlock`
   *
   * @param  {Object} node executable document `LineBlock`
   * @return {Object}      Pandoc `LineBlock`
   */
  _exportLineBlock (node) {
    return {
      t: 'LineBlock',
      c: node.lines.map(line => this._exportInlines(line))
    }
  }

  /**
   * Import a Pandoc `OrderedList` as an executable document `OrderedList`
   *
   * An `OrderedList` is constructed with a set of list attributes and an [array of arrays of blocks]:
   *
   * ```
   * OrderedList ListAttributes [[Block]] -- ^ Ordered list (attributes and a list of items, each a list of blocks)
   * ListAttributes = (Int, ListNumberStyle, ListNumberDelim)
   * ```
   *
   * @param  {Object} node Pandoc `OrderedList`
   * @return {Object}      executable document `OrderedList`
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
   * Export an executable document `OrderedList` as a Pandoc `OrderedList`
   *
   * @param  {Object} node executable document `OrderedList`
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

  /**
   * Import a Pandoc `RawBlock` as an executable document `RawBlock`
   *
   * The Pandoc definition of a `RawBlock` is:
   *
   * ```
   * RawBlock Format String -- ^ Raw block
   * ```
   *
   * @param  {Object} node Pandoc `RawBlock`
   * @return {Object}      executable document `RawBlock`
   */
  _importRawBlock (node) {
    return {
      type: 'RawBlock',
      format: importFormat(node.c[0]),
      content: node.c[1]
    }

    function importFormat (format) {
      return format
    }
  }

  /**
   * Export an executable document `RawBlock` as a Pandoc `RawBlock`
   *
   * @param  {Object} node executable document `RawBlock`
   * @return {Object}      Pandoc `RawBlock`
   */
  _exportRawBlock (node) {
    return {
      t: 'RawBlock',
      c: [
        exportFormat(node.format),
        node.content
      ]
    }

    function exportFormat (format) {
      return format
    }
  }

  /**
   * Import a Pandoc `Table` as an executable document `Table`
   *
   * The Pandoc definition of a `Table` is:
   *
   * ```
   * Table [Inline] [Alignment] [Double] [TableCell] [[TableCell]]  -- ^ Table,
   *                        -- with caption, column alignments (required),
   *                        -- relative column widths (0 = default),
   *                        -- column headers (each a list of blocks), and
   *                        -- rows (each a list of lists of blocks)
   * ```
   *
   * @param  {Object} node Pandoc `Table`
   * @return {Object}      executable document `Table`
   */
  _importTable (node) {
    return {
      type: 'Table',
      // NOTE: Here we set the `caption` of the table, rather than the `title`
      caption: this._importInlines(node.c[0]),
      // Put column alignment and widths into style property
      style: importAlignmentsWidths(node.c[1], node.c[2]),
      // Pandoc table column headers are lists of table cells. Table cells are lists of blocks.
      head: node.c[3].map(cell => this._importBlocks(cell)),
      // Pandoc table rows are lists of table cells. Table cells are lists of blocks.
      rows: node.c[4].map(row => {
        return row.map(cell => this._importBlocks(cell))
      })
    }

    function importAlignmentsWidths (aligns, widths) {
      // Create a style object for each column
      let cols = []
      for (let index in aligns) {
        cols.push({
          align: aligns[index].t.replace('Align', '').toLowerCase(),
          width: widths[index]
        })
      }
      return { cols }
    }
  }

  /**
   * Export an executable document `Table` as a Pandoc `Table`
   *
   * @param  {Object} node executable document `Table`
   * @return {Object}      Pandoc `Table`
   */
  _exportTable (node) {
    let {aligns, widths} = exportAlignmentsWidths(node.style)
    return {
      t: 'Table',
      c: [
        node.caption ? this._exportInlines(node.caption) : [],
        aligns,
        widths,
        node.head ? node.head.map(cell => this._exportBlocks(cell)) : [],
        node.rows ? node.rows.map(row => {
          return row.map(cell => this._exportBlocks(cell))
        }) : []
      ]
    }

    function exportAlignmentsWidths (style) {
      // Create arrays of Pandoc table `Alignment` and widths
      let aligns = []
      let widths = []
      if (style && style.cols) {
        for (let col of style.cols) {
          aligns.push({t: 'Align' + col.align[0].toUpperCase() + col.align.slice(1)})
          widths.push(col.width)
        }
      }
      return {aligns, widths}
    }
  }

  /** ***************** Inline nodes *******************/

  /**
   * Import an array of Pandoc `Inline` nodes
   *
   * This method merges continuous `String` an `Space` nodes
   *
   * @param  {Array} nodes  An array on Pandoc `Inline` nodes
   * @return {Array}        An array of executable document nodes
   */
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
   * Import a Pandoc `Inline` node.
   *
   * This method should do the inverse of `_exportInline`.
   *
   * See https://github.com/jgm/pandoc-types/blob/1.17.5/Text/Pandoc/Definition.hs#L253
   * for the defintion of a Pandoc `Inline`
   *
   * @param  {Object} node   Pandoc `Inline` node
   * @return {Object}        Executable document node
   */
  _importInline (node) {
    switch (node.t) {
      case 'Str': return this._importStr(node)
      case 'Emph': return this._importEmph(node)
      case 'Strong': return this._importStrong(node)
      case 'Strikeout': return this._importStrikeout(node)
      case 'Superscript': return this._importSuperscript(node)
      case 'Subscript': return this._importSubscript(node)
      case 'SmallCaps': return this._importSmallCaps(node)
      case 'Quoted': return this._importQuoted(node)
      case 'Cite': return this._importCite(node)
      case 'Code': return this._importCode(node)
      case 'Space': return this._importSpace(node)
      case 'SoftBreak': return this._importSoftBreak(node)
      case 'LineBreak': return this._importLineBreak(node)
      case 'Math': return this._importMath(node)
      case 'RawInline': return this._importRawInline(node)
      case 'Link': return this._importLink(node)
      case 'Image': return this._importImage(node)
      case 'Note': return this._importNote(node)
      case 'Span': return this._importSpan(node)
      default: return this._importDefault(node)
    }
  }

  _exportInline (node) {
    switch (node.type) {
      case 'Str': return this._exportStr(node)
      case 'Emph': return this._exportEmph(node)
      case 'Strong': return this._exportStrong(node)
      case 'Strikeout': return this._exportStrikeout(node)
      case 'Superscript': return this._exportSuperscript(node)
      case 'Subscript': return this._exportSubscript(node)
      case 'SmallCaps': return this._exportSmallCaps(node)
      case 'Quoted': return this._exportQuoted(node)
      case 'Citation': return this._exportCite(node) // Note `Citation`, rather than `Cite`
      case 'Code': return this._exportCode(node)
      case 'Space': return this._exportSpace(node)
      case 'SoftBreak': return this._exportSoftBreak(node)
      case 'LineBreak': return this._exportLineBreak(node)
      case 'Math': return this._exportMath(node)
      case 'RawInline': return this._exportRawInline(node)
      case 'Link': return this._exportLink(node)
      case 'Image': return this._exportImage(node)
      case 'Note': return this._exportNote(node)
      case 'Span': return this._exportSpan(node)
      default: return this._exportDefault(node)
    }
  }

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

  _importEmph (node) {
    return {
      type: 'Emph',
      nodes: this._importInlines(node.c)
    }
  }

  _exportEmph (node) {
    return {
      t: 'Emph',
      c: this._exportInlines(node.nodes)
    }
  }

  _importStrong (node) {
    return {
      type: 'Strong',
      nodes: this._importInlines(node.c)
    }
  }

  _exportStrong (node) {
    return {
      t: 'Strong',
      c: this._exportInlines(node.nodes)
    }
  }

  _importStrikeout (node) {
    return {
      type: 'Strikeout',
      nodes: this._importInlines(node.c)
    }
  }

  _exportStrikeout (node) {
    return {
      t: 'Strikeout',
      c: this._exportInlines(node.nodes)
    }
  }

  _importSuperscript (node) {
    return {
      type: 'Superscript',
      nodes: this._importInlines(node.c)
    }
  }

  _exportSuperscript (node) {
    return {
      t: 'Superscript',
      c: this._exportInlines(node.nodes)
    }
  }

  _importSubscript (node) {
    return {
      type: 'Subscript',
      nodes: this._importInlines(node.c)
    }
  }

  _exportSubscript (node) {
    return {
      t: 'Subscript',
      c: this._exportInlines(node.nodes)
    }
  }

  _importSmallCaps (node) {
    return {
      type: 'SmallCaps',
      nodes: this._importInlines(node.c)
    }
  }

  _exportSmallCaps (node) {
    return {
      t: 'SmallCaps',
      c: this._exportInlines(node.nodes)
    }
  }

  /**
   * Import a Pandoc `Quoted` node
   *
   * A `Quoted` is constructed as:
   *
   * ```haskell
   * Quoted QuoteType [Inline] -- ^ Quoted text (list of inlines)
   * ```
   *
   * where
   *
   * ```haskell
   * -- | Type of quotation marks to use in Quoted inline.
   * data QuoteType = SingleQuote | DoubleQuote deriving (Show, Eq, Ord, Read, Typeable, Data, Generic)
   * ```
   *
   * @param  {Object} node Pandoc `Quoted` node
   * @return {Object}      Executable document node
   */
  _importQuoted (node) {
    return {
      type: 'Quoted',
      mark: node.c[0].t === 'SingleQuote' ? 'single' : 'double',
      nodes: this._importInlines(node.c[1])
    }
  }

  _exportQuoted (node) {
    return {
      t: 'Quoted',
      c: [
        {
          t: node.mark === 'single' ? 'SingleQuote' : 'DoubleQuote'
        },
        this._exportInlines(node.nodes)
      ]
    }
  }

  /**
   * Import a Pandoc `Cite` node
   *
   * A `Cite` is constructed as:
   *
   * ```haskell
   * Cite [Citation]  [Inline] -- ^ Citation (list of inlines)
   * ```
   *
   * where
   *
   * ```haskell
   * data Citation = Citation { citationId      :: String
   *                          , citationPrefix  :: [Inline]
   *                          , citationSuffix  :: [Inline]
   *                          , citationMode    :: CitationMode
   *                          , citationNoteNum :: Int
   *                          , citationHash    :: Int
   *                          }
   *                 deriving (Show, Eq, Read, Typeable, Data, Generic)
   *
   * data CitationMode = AuthorInText | SuppressAuthor | NormalCitation
   *                     deriving (Show, Eq, Ord, Read, Typeable, Data, Generic)
   * ```
   *
   * @param  {Object} node Pandoc `Cite` node
   * @return {Object}      Executable document node
   */
  _importCite (node) {
    // Convert the Pandoc 'citations' to 'targets'
    return {
      type: 'Citation',
      targets: node.c[0].map(citation => ({
        id: citation.citationId,
        mode: importCitationMode(citation.citationMode),
        prefix: this._importInlines(citation.citationPrefix),
        suffix: this._importInlines(citation.citationSuffix),
        note: citation.citationNoteNum,
        hash: citation.citationHash
      })),
      // It is not clear that we need to teain the inlines, since they have been
      // parsed into tagets (including suffix etc). But for now we keep them.
      nodes: this._importInlines(node.c[1])
    }

    function importCitationMode (mode) {
      // See https://pandoc.org/MANUAL.html#citations for what this alternative
      // citation modes mean.
      switch (mode.t) {
        case 'AuthorInText': return 'author-in-text'
        case 'SuppressAuthor': return 'suppress-author'
        case 'NormalCitation': return 'normal'
      }
    }
  }

  _exportCite (node) {
    return {
      t: 'Cite',
      c: [
        node.targets.map(target => ({
          citationId: target.id,
          citationMode: exportCitationMode(target.mode),
          citationPrefix: this._exportInlines(target.prefix),
          citationSuffix: this._exportInlines(target.suffix),
          citationNoteNum: target.note,
          citationHash: target.hash
        })),
        this._exportInlines(node.nodes)
      ]
    }

    function exportCitationMode (mode) {
      // See https://pandoc.org/MANUAL.html#citations for what this alternative
      // citation modes mean.
      switch (mode) {
        case 'author-in-text': return {t: 'AuthorInText'}
        case 'suppress-author': return {t: 'SuppressAuthor'}
        case 'normal': return {t: 'NormalCitation'}
      }
    }
  }

  _importCode (node) {
    return {
      type: 'Code',
      attrs: this._importAttr(node.c[0]),
      string: node.c[1]
    }
  }

  _exportCode (node) {
    return {
      t: 'Code',
      c: [
        this._exportAttr(node.attrs),
        node.string
      ]
    }
  }

  _importSpace (node) {
    return {
      type: 'Space'
    }
  }

  _exportSpace (node) {
    return {
      t: 'Space'
    }
  }

  _importSoftBreak (node) {
    return {
      type: 'SoftBreak'
    }
  }

  _exportSoftBreak (node) {
    return {
      t: 'SoftBreak'
    }
  }

  _importLineBreak (node) {
    return {
      type: 'LineBreak'
    }
  }

  _exportLineBreak (node) {
    return {
      t: 'LineBreak'
    }
  }

  /**
   * Import a Pandoc `Math` node
   *
   * A Pandoc `Math` node is constructed as:
   *
   * ```haskell
   * Math MathType String  -- ^ TeX math (literal)
   * ```
   *
   * where
   *
   * ```haskell
   * data MathType = DisplayMath | InlineMath deriving (Show, Eq, Ord, Read, Typeable, Data, Generic)
   * ```
   *
   * The internal model for `Math` also allows to alternative langages e.g. AsciiMath
   *
   * @param  {Object} node Pandoc `Math` node
   * @return {Object}      Executable document node
   */
  _importMath (node) {
    return {
      type: 'Math',
      mode: node.c[0].t === 'DisplayMath' ? 'display' : 'inline',
      lang: 'tex',
      string: node.c[1]
    }
  }

  _exportMath (node) {
    return {
      t: 'Math',
      c: [
        {
          t: node.mode === 'display' ? 'DisplayMath' : 'InlineMath'
        },
        node.string
      ]
    }
  }

  _importRawInline (node) {
    return {
      type: 'RawInline',
      format: node.c[0],
      string: node.c[1]
    }
  }

  _exportRawInline (node) {
    return {
      t: 'RawInline',
      c: [
        node.format,
        node.string
      ]
    }
  }

  /**
   * Import a Pandoc `Link` node
   *
   * A `Link` is constructed as:
   *
   * ```haskell
   * Link Attr [Inline] Target  -- ^ Hyperlink: alt text (list of inlines), target
   * ```
   *
   * @param  {Object} node Pandoc `Link` node
   * @return {Object}      Executable document node
   */
  _importLink (node) {
    return {
      type: 'Link',
      attrs: this._importAttr(node.c[0]),
      nodes: this._importInlines(node.c[1]),
      target: node.c[2]
    }
  }

  _exportLink (node) {
    return {
      t: 'Link',
      c: [
        this._exportAttr(node.attrs),
        this._exportInlines(node.nodes),
        node.target
      ]
    }
  }

  /**
   * Import a Pandoc `Image` node
   *
   * A `Image` is constructed as:
   *
   * ```haskell
   * Image Attr [Inline] Target -- ^ Image:  alt text (list of inlines), target
   * ```
   *
   * @param  {Object} node Pandoc `Image` node
   * @return {Object}      Executable document node
   */
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

  _importNote (node) {
    // TODO
    return node
  }

  _exportNote (node) {
    // TODO
    return node
  }

  _importSpan (node) {
    return {
      type: 'Span',
      attrs: this._importAttr(node.c[0]),
      nodes: this._importInlines(node.c[1])
    }
  }

  _exportSpan (node) {
    return {
      t: 'Span',
      c: [
        this._exportAttr(node.attrs),
        this._exportInlines(node.nodes)
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

  /** ***************** Non-Pandoc nodes *******************/
  // These functions handle nodes that are not part of the
  // Pandoc data model.

  _importDefault (node) {
    return {
      type: node.t,
      children: node.c
    }
  }

  _exportDefault (node) {
    switch (node.type) {
      case 'Number':
        // TODO: An alternative way of exporting
        // that retains type
        return {
          t: 'Str',
          c: node.data.toString()
        }
      case 'String':
        return {
          t: 'Str',
          c: node.data
        }
      default:
        return {
          t: node.type,
          c: node.children
        }
    }
  }
}

module.exports = PandocConverter
