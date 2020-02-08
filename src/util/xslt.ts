/**
 * A module for XSLT (Extensible Stylesheet Language Transformations),
 * a language for transforming XML documents into other XML documents,
 * or other formats.
 *
 * Used in Encoda to make use of existing XSLT stylesheets for converting
 * between formats.
 *
 * @see https://en.wikipedia.org/wiki/XSLT
 * @module xslt
 */

// Provides `Array.flat()` for Node.js < 12. Can be removed
// when this package no longer supports thse older versions
import 'array-flat-polyfill'
import { JSDOM } from 'jsdom'
import serialize from 'w3c-xmlserializer'
import { install, xsltProcess } from 'xslt-ts'

// Set up `xslt-ts` with necessary interfaces for
// parsing and serializing XML

const window = new JSDOM().window
const parser = new window.DOMParser()
const serializer = { serializeToString: serialize }
install(parser, serializer, window.document.implementation)

/**
 * Transform a XML document using a XSLT stylesheet.
 *
 * @param doc The XML document to transform
 * @param xslt The XSLT stylesheet to transform it with
 */
export function transform(doc: Node | string, xslt: Node | string): string {
  if (typeof doc === 'string') doc = parser.parseFromString(doc, 'text/xml')
  if (typeof xslt === 'string') xslt = parser.parseFromString(xslt, 'text/xml')
  return xsltProcess(doc, xslt)
}
