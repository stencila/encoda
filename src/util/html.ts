/**
 * Utility functions for processing HTML.
 *
 * This module provides some simple convenience functions for
 * processing HTML documents with a similar API to the
 * `util/xml` module.
 *
 * @module util/html
 */

import { getTheme, themePath, themes } from '@stencila/thema'
import fs from 'fs'
import jsdom from 'jsdom'
import path from 'path'
import { toFile } from './uri'
import { isPath } from './vfile'

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
        : [])
    ]
  }, [])
}

interface Theme {
  styles: string[]
  scripts: string[]
}

/**
 * Tests whether a given string is a valid Thema theme or not.
 */
export const isTheme = (theme: string): boolean =>
  !isPath(theme) && Object.keys(themes).includes(theme.toLowerCase().trim())

export const resolveTheme = (theme: string): Theme => {
  const styles = 'styles.css'
  const js = 'index.js'

  /**
   * If the given `theme` string does not end with a file extensions,
   * use the last part of the path as the directory name
   */
  const themeDir = (dir: string): string =>
    path.extname(dir) === '' ? path.basename(dir) : ''

  const getThemePath = (dir: string, file: string): string =>
    path.join(path.dirname(dir), themeDir(dir), file)

  // If theme is a URL, use it as a directory to look for theme assets based on naming conventions
  if (theme.includes('://')) {
    // Process the theme URL to clean trailing slashes or file names
    const cleanUrl = theme.endsWith('/')
      ? theme.slice(0, theme.length - 1)
      : theme
    const parts = cleanUrl.split('/')
    const endsInFile = new RegExp('\\.\\w+$').test(parts[parts.length - 1])
    // Account for receiving top level URL such as 'http://example.com', and not consider '.com' as a file extension
    const urlParts =
      parts.length > 3 && endsInFile ? parts.slice(0, parts.length - 1) : parts
    const url = urlParts.join('/')

    return {
      styles: [`${url}/${styles}`],
      scripts: [`${url}/${js}`]
    }
  }

  // Otherwise check if theme is a filepath
  if (isPath(theme)) {
    return {
      styles: [getThemePath(theme, styles)],
      scripts: [getThemePath(theme, js)]
    }
  }

  // Finally, fall back to looking for theme in Thema package
  return {
    styles: [getThemePath(themePath, `${getTheme(theme)}/${styles}`)],
    scripts: [getThemePath(themePath, `${getTheme(theme)}/${js}`)]
  }
}

const themaVersion = require(path.join(
  require.resolve('@stencila/thema'),
  '..',
  '..',
  'package.json'
)).version

const themaMajor = themaVersion.split('.')[0]

/**
 * Return a CDN link to an asset, cleaning up any Windows specific path separators.
 */
export const generateCDNUrl = (asset: string): string => {
  return `https://unpkg.com/@stencila/thema@${themaMajor}/${asset}`.replace(
    /\\/g,
    '/'
  )
}

/**
 * Fetches theme file contents either from a local filepath or a URL, returning the contents as a string
 */
export const getThemeAssets = async (
  theme: string,
  isBundle = false
): Promise<Theme> => {
  const resolvedTheme = resolveTheme(theme)

  // If we are bundling the theme, return the contents of the file, otherwise a link the to CDN hosted Thema file
  const contentsFromThema = (asset: string): string => {
    return !isBundle
      ? generateCDNUrl(asset)
      : fs
          .readFileSync(
            path.join(require.resolve('@stencila/thema'), '..', '..', asset)
          )
          .toString()
  }

  // Update Thema assets with either file contents, or as a link to CDN hosted version
  if (isTheme(theme)) {
    return Object.entries(resolvedTheme).reduce(
      (_theme: Theme, [key, assets]) => ({
        ..._theme,
        [key]: assets.map(contentsFromThema)
      }),
      { styles: [], scripts: [] }
    )
  }

  const fetchAssets = async (assets: string[]): Promise<string[]> =>
    Promise.all(
      assets.map(asset =>
        toFile(asset).then(file => fs.readFileSync(file.filePath).toString())
      )
    )

  // Fetch file contents for inlining when bundling assets
  if (isBundle) {
    const styles = await fetchAssets(resolvedTheme.styles)
    const scripts = await fetchAssets(resolvedTheme.scripts)

    return {
      styles,
      scripts
    }
  }

  return resolvedTheme
}
