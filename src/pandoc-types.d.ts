/**
 * Typescript definitions for Pandoc.
 *
 * These type definitions are based on the definitions in
 * [`pandoc-types v1.17.5.4`](https://github.com/jgm/pandoc-types/blob/1.17.5.4/Text/Pandoc/Definition.hs).
 * That is the version used in Pandoc v2.7.2.
 *
 * Most of the comment strings are copy-pasted directly from there.
 */

interface Document {
  /**
   * The Pandoc types API version
   */
  'pandoc-api-version': [1, 17, 5, 4]

  /**
   * Metadata for the document e.g from Markdown YAML header
   */
  meta: Meta

  /**
   * The main content of the document
   */
  blocks: Block[]
}

/**
 * An element in a Pandoc document
 *
 * All elements, including metadata values, have a
 * `t` property indicating the type of element, and a
 * `c` property which are arguments to it's constructor.
 *
 * This generic interface can be used to define type aliases
 * where only the type name `t`, and constructor arguments `a`
 * are varied.
 *
 * However, to avoid the error "type alias circularly references itself"
 * it is necessary to defined a new `interface` instead of a type alias.
 * See below and [this answer](https://github.com/Microsoft/TypeScript/issues/3496#issuecomment-128553540)
 */
interface Element<Type, Args = null> {
  t: Type
  c: Args
}

/**
 * List of metadata element type names
 */
type Meta = { [key: string]: MetaValue }

/**
 * Union type of metadata element types
 */
export type MetaValue =
  | MetaMap
  | MetaList
  | MetaBool
  | MetaString
  | MetaInlines
  | MetaBlocks

interface DictMetaValue {
  [key: string]: MetaValue
}
interface ArrayMetaValue extends Array<MetaValue> {}

export type MetaMap = Element<'MetaMap', DictMetaValue>
export type MetaList = Element<'MetaList', ArrayMetaValue>
export type MetaBool = Element<'MetaBool', boolean>
export type MetaString = Element<'MetaString', string>
export type MetaInlines = Element<'MetaInlines', Inline[]>
export type MetaBlocks = Element<'MetaBlocks', Block[]>

/**
 * Union type of metadata element types
 */
type Block =
  | Plain
  | Para
  | LineBlock
  | CodeBlock
  | RawBlock
  | BlockQuote
  | OrderedList
  | BulletList
  | DefinitionList
  | Header
  | HorizontalRule
  | Table
  | Div
  | Null

/**
 * Plain text, not a paragraph
 */
export type Plain = Element<'Plain', Inline[]>

/**
 * Paragraph
 */
export type Para = Element<'Para', Inline[]>

/**
 * Multiple non-breaking lines
 */
export type LineBlock = Element<'LineBlock', Inline[][]>

/**
 * Code block (literal) with attributes
 */
export type CodeBlock = Element<'CodeBlock', [Attr, string]>

/**
 * Attributes of an element:
 *  - identifier
 *  - classes
 *  - key-value pairs
 */
export type Attr = [string, string[], [string, string][]]

/**
 * Raw block
 */
export type RawBlock = Element<'RawBlock', [Format, string]>

/**
 * Block quote (list of blocks)
 */
export interface BlockQuote {
  t: 'BlockQuote'
  c: Block[]
}

/**
 * Ordered list (attributes and a list of items, each a list of blocks)
 */
export interface OrderedList {
  t: 'OrderedList'
  c: [ListAttributes, Block[][]]
}

/**
 * List attributes.
 */
export type ListAttributes = [number, ListNumberStyle, ListNumberDelim]

/**
 * Style of list numbers.
 */
export enum ListNumberStyle {
  'DefaultStyle',
  'Example',
  'Decimal',
  'LowerRoman',
  'UpperRoman',
  'LowerAlpha',
  'UpperAlpha'
}

/**
 * Delimiter of list numbers.
 */
export enum ListNumberDelim {
  'DefaultDelim',
  'Period',
  'OneParen',
  'TwoParen'
}

/**
 * Bullet list (list of items, each a list of blocks)
 */
export interface BulletList {
  t: 'BulletList'
  c: Block[][]
}

/**
 * Definition list Each list item is a pair consisting of a term
 * (a list of inlines) and one or more definitions (each a list of blocks)
 */
export interface DefinitionList {
  t: 'DefinitionList'
  c: [Inline[], Block[][]][]
}

/**
 * Header - level (integer) and text (inlines)
 */
export type Header = Element<'Header', [number, Attr, Inline[]]>

/**
 * Horizontal rule
 */
export type HorizontalRule = Element<'HorizontalRule'>

/**
 * Table having:
 *  - caption,
 *  - column alignments (required),
 *  - relative column widths (0 = default),
 *  - column headers (each a list of blocks),
 *  - and rows (each a list of lists of blocks)
 */
export interface Table {
  t: 'Table'
  c: [Inline[], Alignment[], number[], TableCell[], TableCell[][]]
}

/**
 * Alignment of a table column.
 */
export enum Alignment {
  'AlignLeft',
  'AlignRight',
  'AlignCenter',
  'AlignDefault'
}

/**
 * Table cells (list of blocks)
 */
type TableCell = [Block]

/**
 * Generic block container with attributes
 */
export interface Div {
  t: 'Div'
  c: [Attr, Block[]]
}

/**
 * Nothing
 */
export type Null = Element<'Null'>

/**
 * Union type of inline elements
 */
type Inline =
  | Str
  | Emph
  | Strong
  | Strikeout
  | Superscript
  | Subscript
  | SmallCaps
  | Quoted
  | Cite
  | Code
  | Space
  | SoftBreak
  | LineBreak
  | Math
  | RawInline
  | Link
  | Image
  | Note
  | Span

export type Str = Element<'Str', string>

/**
 * Base interface for inline elements that
 * only contain a list of other inlines
 */
interface InlineList {
  c: Inline[]
}

/**
 * Emphasized text (list of inlines)
 */
export interface Emph extends InlineList {
  t: 'Emph'
}

/**
 * Strongly emphasized text (list of inlines)
 */
export interface Strong extends InlineList {
  t: 'Strong'
}

/**
 * Strikeout text (list of inlines)
 */
export interface Strikeout extends InlineList {
  t: 'Strikeout'
}

/**
 * Superscripted text (list of inlines)
 */
export interface Superscript extends InlineList {
  t: 'Superscript'
}

/**
 * Subscripted text (list of inlines)
 */
export interface Subscript extends InlineList {
  t: 'Subscript'
}

/**
 * Small caps text (list of inlines)
 */
export interface SmallCaps extends InlineList {
  t: 'SmallCaps'
}

/**
 * Quoted text (list of inlines)
 */
export interface Quoted {
  t: 'Quoted'
  c: [QuoteType, Inline[]]
}

/**
 * Type of quotation marks to use in Quoted inline.
 */
export enum QuoteType {
  'SingleQuote',
  'DoubleQuote'
}

/**
 * Citations (list of inlines)
 */
export interface Cite {
  t: 'Cite'
  c: [Citation[], Inline[]]
}

export interface Citation {
  citationId: string
  citationPrefix: Inline[]
  citationSuffix: Inline[]
  citationMode: CitationMode
  citationNoteNum: number
  citationHash: number
}

export enum CitationMode {
  'AuthorInText',
  'SuppressAuthor',
  'NormalCitation'
}

/**
 * Inline code
 */
export type Code = Element<'Code', [Attr, string]>

/**
 * Inter-word space
 */
export type Space = Element<'Space'>

/**
 * Soft line break
 */
export type SoftBreak = Element<'SoftBreak'>

/**
 * Hard line break
 */
export type LineBreak = Element<'LineBreak'>

/**
 * TeX math
 */
export type Math = Element<'Math', [MathType, string]>

/**
 * Type of math element (display or inline)
 */
export enum MathType {
  'DisplayMath',
  'InlineMath'
}

/**
 * Raw inline
 */
export type RawInline = Element<'RawInline', [Format, string]>

export type Format = string

/**
 * Hyperlink: attributes, alt text, and target.
 */
export interface Link {
  t: 'Link'
  c: [Attr, Inline[], Target]
}

/**
 * Image: attributes, alt text, and target.
 */
export interface Image {
  t: 'Image'
  c: [Attr, Inline[], Target]
}

/**
 * Image or hyperlink target: a (URL, title) tuple.
 */
export type Target = [string, string]

/**
 * Footnote or endnote
 */
export interface Note {
  t: 'Note'
  c: Block[]
}

/**
 * Generic inline container with attributes
 */
export interface Span {
  t: 'Span'
  c: [Attr, Inline[]]
}
