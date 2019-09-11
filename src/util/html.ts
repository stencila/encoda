/**
 * Utility functions for processing HTML.
 *
 * This module provides some simple convenience functions for
 * processing HTML documents with a similar API to the
 * `util/xml` module.
 *
 * @module util/html
 */

import jsdom from 'jsdom'

const JSDOM = new jsdom.JSDOM()

/**
 * Parse HTML into a `HTMLDocument`
 */
export const load = (html: string): HTMLDocument => {
  const dom = new jsdom.JSDOM(html)
  return dom.window.document
}

/**
 * Create a `HTMLElement`.
 */
export const elem = (
  tagName: string,
  attrs?: { [key: string]: string | number | boolean },
  ...children: (string | HTMLElement)[]
): HTMLElement => {
  const elem = JSDOM.window.document.createElement(tagName)
  if (attrs !== undefined)
    for (const [key, value] of Object.entries(attrs))
      elem.setAttribute(key, value.toString())
  for (const child of children) {
    if (typeof child === 'string') elem.appendChild(JSDOM.window.document.createTextNode(child))
    else elem.appendChild(child)
  }
  return elem
}

/**
 * Get an element's text content.
 */
export const text = (elem: Node | null): string | null => {
  if (elem === null) return null
  return elem.textContent
}

/**
 * Get the first descendent element that matches the selector
 */
export const first = (
  elem: HTMLElement | null,
  selector: string = '*'
): HTMLElement | null => {
  if (elem === null) return null
  return elem.querySelector(selector)
}

/**
 * Get all descendent elements that match the selector
 */
export const all = (
  elem: HTMLElement | null,
  selector: string = '*'
): HTMLElement[] => {
  if (elem === null) return []
  return Array.from(elem.querySelectorAll(selector))
}

/**
 * Get all descendent nodes that have a given name e.g. `figure`, `#text`, `#comment`
 */
export const allName = (elem: HTMLElement | null, name: string): Node[] => {
  if (elem === null) return []
  return Array.from(elem.childNodes).reduce((prev: Node[], node) => {
    return [
      ...prev,
      ...(node.nodeName === name ? [node] : []),
      ...(node.nodeType === node.ELEMENT_NODE
        ? allName(node as HTMLElement, name)
        : [])
    ]
  }, [])
}
