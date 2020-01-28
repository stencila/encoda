/**
 * Module for decoding and encoding HTML Microdata
 *
 * @see {@link https://www.w3.org/TR/microdata/| W3.org Microdata spec}
 */

import * as stencila from '@stencila/schema'
import fs from 'fs-extra'
import path from 'path'
import { getLogger } from '@stencila/logga'

const log = getLogger('encoda:html:microdata')

export type Types = {
  Null: 'Null'
  Boolean: 'Boolean'
  Number: 'Number'
  Object: 'Object'
  Array: 'Array'
} & stencila.Types

// Read the Stencila JSON-LD `@context` which provides a
// mapping between vocabularies.
const context = fs.readJSONSync(
  path.join(
    path.dirname(require.resolve('@stencila/schema')),
    'stencila.jsonld'
  )
)['@context'] as Record<string, string | { '@id': string }>

// Create mapping from vocabulary terms (Stencila Schema types and
// property names) to their compact IRIs ('@id's) and vice-versa.
const termToId: Record<string, string> = {}
const idToTerm: Record<string, string> = {}
for (const [term, value] of Object.entries(context)) {
  if (typeof value === 'object') {
    const id = value['@id']
    termToId[term] = id
    idToTerm[id] = term
  }
}

/**
 * Attributes for Microdata ["items"](https://www.w3.org/TR/microdata/#items)
 *
 * "The itemtype attribute must not be specified on elements that do not have
 *  an itemscope attribute specified."
 */
export interface MicrodataItem {
  itemscope: ''
  itemtype: string
  itemid?: string
}

/**
 * Attributes for Microdata ["properties"](https://www.w3.org/TR/microdata/#names:-the-itemprop-attribute)
 */
export interface MicrodataProperty {
  itemprop: string
  itemref: string
}

export type Microdata = MicrodataItem & MicrodataProperty

/**
 * Create all Microdata attributes for a Stencila `Node`.
 *
 * @param node The node e.g. a `Person` node
 * @param property The name of the property that this node is part of e.g `'author'`
 */
export function encodeMicrodataAttrs(
  node: stencila.Node,
  property?: string
): Microdata | {} {
  return {
    ...encodeMicrodataItem(node),
    ...(property !== undefined ? encodeMicrodataProperty(property) : {})
  }
}

/**
 * Encode the `MicrodataItem` attributes for a node.
 */
export function encodeMicrodataItem(node: stencila.Node): MicrodataItem | {} {
  const titleCase = (str: string): string => str[0].toUpperCase() + str.slice(1)
  const type = titleCase(stencila.nodeType(node))
  const itemtype = encodeMicrodataItemtype(type as keyof Types)
  if (itemtype === undefined) return {}
  const itemid = stencila.isEntity(node) && node.id !== undefined ? {itemid: node.id} : {}
  return {
    itemscope: '',
    itemtype,
    ...itemid
  }
}

/**
 * Get the Stencila Schema type for a HTML Microdata `itemtype`.
 *
 * @param {string} type
 * @returns {keyof Types}
 */
export function decodeMicrodataItemtype(itemtype: string): keyof Types {
  // Compact the id by replacing known prefixes
  const id = itemtype
    .replace(/^https?:\/\/schema\.org\//, 'schema:')
    .replace(/^https?:\/\/schema\.stenci\.la\//, 'stencila:')

  // Primitive types that are not included in the
  // JSON-LD `@context`.
  switch (id) {
    case 'schema:Boolean':
    case 'schema:Number':
    case 'stencila:Null':
    case 'stencila:Object':
    case 'stencila:Array':
      return id.split(':')[1] as keyof Types
  }

  const term = idToTerm[id]
  if (term === undefined) {
    log.error(`Unhandled itemtype: ${itemtype}`)
    return 'Entity'
  }
  return term as keyof Types
}

/**
 * Get the value of the HTML Microdata `itemtype` attribute
 * for a Stencila Schema type.
 *
 * This uses the JSON-LD `@context` in `stencila.jsonld` (which
 * provides a mapping between vocabularies) to translate
 * type names used in the Stencila Schema
 * to those used in other schemas (e.g. Schema.org, Bioschemas).
 * The [compact IRIs](https://www.w3.org/TR/json-ld11/#compact-iris)
 * in the `@context` e.g. `schema:Person` are expanded to a URL
 * e.g. `http://schema.org/Person` suitable for the `itemtype` attribute.
 *
 * @param {string} type The name of the type e.g. `'Article'`
 */
export function encodeMicrodataItemtype(type: keyof Types): string | undefined {
  // Primitive types that are not included in the
  // JSON-LD `@context`. Some are available in Schema.org.
  switch (type) {
    case 'Boolean':
    case 'Number':
      return `http://schema.org/${type}`
    case 'Null':
    case 'Object':
    case 'Array':
      return `http://schema.stenci.la/${type}`
  }

  const id = termToId[type]
  if (id === undefined) {
    log.error(`Unhandled type: ${type}`)
    return undefined
  }
  const [prefix, name] = id.split(':')
  switch (prefix) {
    case 'schema':
      return `http://schema.org/${name}`
    case 'stencila':
      return `http://schema.stenci.la/${name}`
  }
  return undefined
}

/**
 * Encode the `MicrodataProperty` attributes for a property.
 */
export function encodeMicrodataProperty(
  property: string
): MicrodataProperty | {} {
  const itemprop = encodeMicrodataItemprop(property)
  if (itemprop === undefined) return {}
  return { itemprop }
}

/**
 * Get the value of the HTML Microdata `itemprop` attribute
 * for a Stencila Schema property.
 *
 * As with `encodeMicrodataItemtype`, uses the JSON-LD `@context`
 * to translate property names used in the Stencila Schema
 * to those used in other schemas (e.g. Schema.org, Bioschemas).
 *
 * @param {string} type The name of the property e.g. `'authors'`
 */
export function encodeMicrodataItemprop(property: string): string | undefined {
  const mapping = context[property]
  if (mapping === undefined) return undefined
  if (typeof mapping === 'string') return mapping

  const id = mapping['@id']
  const parts = id.split(':')
  const [prefix, name] =
    parts.length === 1 ? [undefined, parts[0]] : [parts[0], parts[1]]
  return name
}

/**
 * As we enrich most elements with Schema.org attributes, extra `itemprop` attributes do not validate
 * using Structured Data testing tools. To get around this, and still have semantic element selectors available,
 * we add Stencila Schema specific attributes as `data-itemprop`s.
 */
export const stencilaItemProp = 'data-itemprop'
