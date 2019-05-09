/**
 * This is a temporary file for storing `parse*`, and `unparse*` functions that
 * are currently not being used (but that were developed in a previous iteration
 * of the `pandoc` compiler).
 *
 * Most, if not all require extension of the Stencila Schema to be able to handle
 * them in a Stencila document tree.
 */

/**
 * Parse a Pandoc `DefinitionList` as a Stencila `DescriptionList`
 */
function parseDefinitionList(node) {
  return {
    type: 'DescriptionList',
    items: node.c.map(item => {
      return {
        term: parseInlines(item[0]),
        // NOTE: Currently, only importing the first set of blocks. It is not clear if Pandoc
        // ever supplied more than one set of blocks
        desc: parseBlocks(item[1][0])
      }
    })
  }
}

/**
 * Unparse Stencila `DescriptionList` as a Pandoc `DefinitionList`
 */
function unparseDefinitionList(node) {
  return {
    t: 'DefinitionList',
    c: node.items.map(item => {
      return [unparseInlines(item.term), [unparseBlocks(item.desc)]]
    })
  }
}

function parseDiv(node) {
  return {
    type: 'Div',
    attrs: parseAttr(node.c[0]),
    nodes: parseBlocks(node.c[1])
  }
}

function unparseDiv(node) {
  return {
    t: 'Div',
    c: [unparseAttr(node.attrs), unparseBlocks(node.nodes)]
  }
}

/**
 * Parse a Pandoc `LineBlock` as Stencila `LineBlock`
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
function parseLineBlock(node) {
  return {
    type: 'LineBlock',
    lines: node.c.map(line => parseInlines(line))
  }
}

/**
 * Unparse Stencila `LineBlock` as a Pandoc `LineBlock`
 *
 * @param  {Object} node executable document `LineBlock`
 * @return {Object}      Pandoc `LineBlock`
 */
function unparseLineBlock(node) {
  return {
    t: 'LineBlock',
    c: node.lines.map(line => unparseInlines(line))
  }
}

function parseSuperscript(node) {
  return {
    type: 'Superscript',
    nodes: parseInlines(node.c)
  }
}

function unparseSuperscript(node) {
  return {
    t: 'Superscript',
    c: unparseInlines(node.nodes)
  }
}

function parseSubscript(node) {
  return {
    type: 'Subscript',
    nodes: parseInlines(node.c)
  }
}

function unparseSubscript(node) {
  return {
    t: 'Subscript',
    c: unparseInlines(node.nodes)
  }
}

function parseSmallCaps(node) {
  return {
    type: 'SmallCaps',
    nodes: parseInlines(node.c)
  }
}

function unparseSmallCaps(node) {
  return {
    t: 'SmallCaps',
    c: unparseInlines(node.nodes)
  }
}

/**
 * Parse a Pandoc `Cite` node
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
function parseCite(node) {
  // Convert the Pandoc 'citations' to 'targets'
  return {
    type: 'Citation',
    targets: node.c[0].map(citation => ({
      id: citation.citationId,
      mode: importCitationMode(citation.citationMode),
      prefix: parseInlines(citation.citationPrefix),
      suffix: parseInlines(citation.citationSuffix),
      note: citation.citationNoteNum,
      hash: citation.citationHash
    })),
    // It is not clear that we need to teain the inlines, since they have been
    // parsed into tagets (including suffix etc). But for now we keep them.
    nodes: parseInlines(node.c[1])
  }

  function importCitationMode(mode) {
    // See https://pandoc.org/MANUAL.html#citations for what this alternative
    // citation modes mean.
    switch (mode.t) {
      case 'AuthorInText':
        return 'author-in-text'
      case 'SuppressAuthor':
        return 'suppress-author'
      case 'NormalCitation':
        return 'normal'
    }
  }
}

function unparseCite(node) {
  return {
    t: 'Cite',
    c: [
      node.targets.map(target => ({
        citationId: target.id,
        citationMode: exportCitationMode(target.mode),
        citationPrefix: unparseInlines(target.prefix),
        citationSuffix: unparseInlines(target.suffix),
        citationNoteNum: target.note,
        citationHash: target.hash
      })),
      unparseInlines(node.nodes)
    ]
  }

  function exportCitationMode(mode) {
    // See https://pandoc.org/MANUAL.html#citations for what this alternative
    // citation modes mean.
    switch (mode) {
      case 'author-in-text':
        return { t: 'AuthorInText' }
      case 'suppress-author':
        return { t: 'SuppressAuthor' }
      case 'normal':
        return { t: 'NormalCitation' }
    }
  }
}

function parseSoftBreak(node) {
  return {
    type: 'SoftBreak'
  }
}

function unparseSoftBreak(node) {
  return {
    t: 'SoftBreak'
  }
}

function parseLineBreak(node) {
  return {
    type: 'LineBreak'
  }
}

function unparseLineBreak(node) {
  return {
    t: 'LineBreak'
  }
}

/**
 * Parse a Pandoc `Math` node
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
function parseMath(node) {
  return {
    type: 'Math',
    mode: node.c[0].t === 'DisplayMath' ? 'display' : 'inline',
    lang: 'tex',
    string: node.c[1]
  }
}

function unparseMath(node) {
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

function parseRawInline(node) {
  return {
    type: 'RawInline',
    format: node.c[0],
    string: node.c[1]
  }
}

function unparseRawInline(node) {
  return {
    t: 'RawInline',
    c: [node.format, node.string]
  }
}

function parseSpan(node) {
  return {
    type: 'Span',
    attrs: parseAttr(node.c[0]),
    nodes: parseInlines(node.c[1])
  }
}

function unparseSpan(node) {
  return {
    t: 'Span',
    c: [unparseAttr(node.attrs), unparseInlines(node.nodes)]
  }
}

// Attr = [String, [String], [[String, String]]]
// 0 = id
// 1 = classes
// 2 = name,value pairs of other attributes
//
// note spelling Attr (without 's') to maintain consistency with Pandoc type definition

function parseAttr(node) {
  let attrs = {}
  if (node[0]) attrs.id = node[0]
  if (node[1].length) attrs.class = node[1].join(' ')
  for (let attr of node[2]) attrs[attr[0]] = attr[1]
  return attrs
}

function unparseAttr(attrs) {
  let node = ['', [], []]
  if (attrs.id) node[0] = attrs.id
  if (attrs.class) node[1] = attrs.class.split(' ')
  for (let [name, value] of Object.entries(attrs)) {
    if (name !== 'id' && name !== 'class') node[2].push([name, value])
  }
  return node
}
