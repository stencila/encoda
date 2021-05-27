/**
 * Utility functions for processing HTML.
 *
 * This module provides some simple convenience functions for
 * processing HTML documents with a similar API to the
 * `util/xml` module.
 *
 * @module util/html
 */

import { getTheme, styleEntry, scriptEntry, ThemaAssets } from '@stencila/thema'
import fs from 'fs'
import jsdom from 'jsdom'
import path from 'path'
import { toFile } from './uri'
import { isPath } from './vfile'
import log from './logging'

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
    if (typeof child === 'string')
      elem.appendChild(JSDOM.window.document.createTextNode(child))
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
  selector = '*'
): HTMLElement | null => {
  if (elem === null) return null
  return elem.querySelector(selector)
}

/**
 * Get all descendent elements that match the selector
 */
export const all = (
  elem: HTMLElement | null,
  selector = '*'
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
        : []),
    ]
  }, [])
}

const themeNotFound = (themeName: string): ThemaAssets => {
  log.warn(`Theme assets could not be found for theme: '${themeName}'`)

  return {
    styles: [],
    scripts: [],
  }
}

/**
 * Given an array of filepaths or URLs, returns the file contents as strings.
 *
 * @async
 * @param {string[]} assets - Filepaths or URLs to read
 * @return {Promise<string[]>} - Promise resolving to the file contents
 */
const fetchAssets = async (assets: string[]): Promise<string[]> =>
  Promise.all(
    assets.map((asset) =>
      toFile(asset).then((file) => fs.readFileSync(file.filePath).toString())
    )
  )

/**
 * Given a theme name, path, or URL, attempt to resolve it into theme Stylesheet and JavaScript entry files
 * (`style.css` and `index.js`).
 *
 * @param {string} theme - Can be a Thema theme name, or a URL/filepath to a directory following Thema theme conventional structure
 * @return {ThemaAssets} - An object containing all the theme‘s CSS and JavaScript files as an array.
 */
export const getThemeAssets = async (
  theme: string,
  isBundle = false
): Promise<ThemaAssets> => {
  let resolvedTheme = getTheme(theme, !isBundle)

  // If theme could be resolved, it is a Thema theme and no other processing needs to be done
  if (resolvedTheme !== undefined) {
    return resolvedTheme
  }

  /**
   * If the given `theme` string does not end with a file extensions,
   * use the last part of the path as the directory name
   */
  const themeDir = (dir: string): string =>
    path.extname(dir) === '' ? path.basename(dir) : ''

  const getThemePath = (dir: string, file: string): string =>
    path.join(path.dirname(dir), themeDir(dir), file)

  // If theme is a URL, use it as a directory to look for theme assets based on Thema naming conventions
  // looking for a `styles.css` and `index.js` files.
  if (theme.includes('://')) {
    // Process the theme URL to clean trailing slashes or file names
    const cleanUrl = theme.endsWith('/')
      ? theme.slice(0, theme.length - 1)
      : theme
    const parts = cleanUrl.split('/')
    const endsInFile = /\.\w+$/.test(parts[parts.length - 1])
    // Account for receiving top level URL such as 'http://example.com', and not consider '.com' as a file extension
    const urlParts =
      parts.length > 3 && endsInFile ? parts.slice(0, parts.length - 1) : parts
    const url = urlParts.join('/')

    resolvedTheme = {
      styles: [`${url}/${styleEntry}`],
      scripts: [`${url}/${scriptEntry}`],
    }
  }

  // If theme is a filepath, and contains stylesheet and JavaScript entry files, it is a valid Thema theme
  if (
    isPath(theme) &&
    fs.existsSync(path.join(theme, styleEntry)) &&
    fs.existsSync(path.join(theme, scriptEntry))
  ) {
    resolvedTheme = {
      styles: [getThemePath(theme, styleEntry)],
      scripts: [getThemePath(theme, scriptEntry)],
    }
  }

  // If a theme could not be resolved, return an empty theme and log a warning message
  if (resolvedTheme === undefined) {
    return themeNotFound(theme)
  }

  // If a theme is to be bundled, read the contents of the theme files
  const styles = isBundle
    ? await fetchAssets(resolvedTheme.styles)
    : resolvedTheme.styles
  const scripts = isBundle
    ? await fetchAssets(resolvedTheme.scripts)
    : resolvedTheme.scripts

  return {
    styles,
    scripts,
  }
}
