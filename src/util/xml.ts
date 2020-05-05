/**
 * Utility types and functions for processing XML.
 *
 * @module util/xml
 */

/**
 * Hello contributor 👋! If you are working on this file, please
 * endeavor to remove the need for the following `eslint-disable` line 🙏.
 * Remove the line and run `npx eslint path/to/this/file.ts` to
 * see which code needs some linting ❤️.
 * See https://github.com/stencila/encoda/issues/199 for suggestions
 * on how to refactor code to avoid non-strict boolean expressions.
 */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */

import xmljs from 'xml-js'

export type Element = xmljs.Element
export type Attributes = xmljs.Attributes

/**
 * Load (i.e. parse) a XML document from a string
 *
 * @param xml The XML string to load
 */
export function load(xml: string): Element {
  return xmljs.xml2js(xml, { compact: false }) as Element
}

/**
 * Dump (i.e. serialize) a XML document to a string
 */
export const dump = xmljs.js2xml

/**
 * Create an `Element`
 */
export function elem(
  name: string,
  attrs?: Attributes | Element | string | null,
  ...children: (Element | string | null)[]
): Element {
  const notAttrs =
    !attrs ||
    typeof attrs === 'string' ||
    (typeof attrs === 'object' &&
      (attrs.type === 'element' || attrs.type === 'text'))
  const attributes = (notAttrs ? {} : attrs) as Attributes
  const elements = [...(attrs && notAttrs ? [attrs] : []), ...children]
    .map((elem) =>
      typeof elem === 'string' ? { type: 'text', text: elem } : elem
    )
    .reduce((prev: Element[], curr) => (curr ? [...prev, curr] : prev), [])
  return {
    type: 'element',
    name: name,
    attributes,
    elements,
  }
}

/**
 * Get an element's text content. Will always coerce the result to a string, so
 * null elements or those of the wrong type will return ''
 */
export function text(elem: Element | null): string {
  return textOrUndefined(elem) ?? ''
}

/**
 * Get an element's text content if possible, if the element is null, has the
 * wrong type or is not text, return undefined
 */
export function textOrUndefined(elem: Element | null): string | undefined {
  if (elem === null) return undefined
  if (elem.type === 'text') return elem.text ? elem.text.toString() : undefined
  else return elem.elements ? elem.elements.map(text).join('') : undefined
}

/**
 * Split the text of `elem` on `separator`. If `elem` is null or text can't be
 * extracted from it, return undefined
 */
export function splitTextOrUndefined(
  elem: Element | null,
  separator: string | RegExp
): string[] | undefined {
  const t = textOrUndefined(elem)
  if (t === undefined) return t
  return t.split(separator)
}

/**
 * Get an elements text content and convert it to an integer. If the element
 * content is undefined/empty/null/invalid or not a number, then return
 * undefined
 */
export function intOrUndefined(elem: Element | null): number | undefined {
  const i = parseInt(text(elem))
  return isNaN(i) ? undefined : i
}

/**
 * Get an element attribute
 */
export function attr(elem: Element | null, name: string): string | null {
  const value = elem?.attributes?.[name]
  return value ? value.toString() : null
}

/**
 * Get an element attribute or `undefined` if it does not exist
 */
export function attrOrUndefined(
  elem: Element | null,
  name: string
): string | undefined {
  const value = attr(elem, name)
  return value === null ? undefined : value
}

/**
 * Does an element match name/s and attributes
 */
export function matches(
  elem: Element,
  name: string | string[],
  attributes: Attributes = {}
): boolean {
  if (!elem.name) return false
  if (typeof name === 'string' && elem.name !== name) return false
  if (Array.isArray(name) && !name.includes(elem.name)) return false
  for (const [key, value] of Object.entries(attributes)) {
    if (!elem.attributes) return false
    if (elem.attributes[key] !== value) return false
  }
  return true
}

/**
 * Get the first child element that matches name/s and attributes
 */
export function child(
  elem: Element | null,
  name: string | string[],
  attributes: Attributes = {}
): Element | null {
  if (elem === null) return null
  if (elem.elements) {
    for (const child of elem.elements) {
      if (matches(child, name, attributes)) return child
    }
  }
  return null
}

/**
 * Get all child elements that match name/s and attributes
 */
export function children(
  elem: Element | null,
  name: string | string[],
  attributes: Attributes = {}
): Element[] {
  return elem?.elements
    ? elem.elements.filter((child) => matches(child, name, attributes))
    : []
}

/**
 * Get the first descendent element that matches name/s and attributes
 */
export function first(
  elem: Element | null,
  name: string | string[],
  attributes: Attributes = {}
): Element | null {
  if (elem === null) return null
  if (elem.elements) {
    for (const child of elem.elements) {
      if (matches(child, name, attributes)) return child
    }
    for (const child of elem.elements) {
      const result = first(child, name, attributes)
      if (result) return result
    }
  }
  return null
}

/**
 * Get all descendent elements that match name/s and attributes
 */
export function all(
  elem: Element | null,
  name: string | string[],
  attributes: Attributes = {}
): Element[] {
  if (elem?.elements) {
    return [
      ...elem.elements.filter((child) => matches(child, name, attributes)),
      ...elem.elements
        .map((child) => all(child, name, attributes))
        .reduce((prev, curr) => [...prev, ...curr]),
    ]
  }
  return []
}
