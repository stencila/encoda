/**
 * A module for XSLT (Extensible Stylesheet Language Transformations),
 * a language for transforming XML documents into other XML documents,
 * or other formats.
 *
 * Used in Encoda to make use of existing XSLT stylesheets for converting
 * between formats.
 *
 * Three strategies for implementing XSLT support were considered / tried.
 *
 * 1. Use the `xslt-ts` package. At time of writing, did not have support for
 *    several XSLT node types https://github.com/backslash47/xslt/blob/8f8ddf0282d1db720912a5835687642fd21745ac/src/xslt.ts#L184-L224
 *    and not recently maintained.
 *
 * 2. Shell out to `xsltproc` (as we do for Pandoc). Seems more difficult to
 *    automatically install (shared lib dependencies?) on verious platforms.
 *
 * 3. Use the `XSLTProcessor` within Puppeteer. We're already using Puppeteer,
 *    the implementation is complete (?), and it's available across platforms
 *
 * @see https://en.wikipedia.org/wiki/XSLT
 * @module util/xslt
 */

import * as puppeteer from './puppeteer'
import { getLogger } from '@stencila/logga'

const log = getLogger('encoda:xslt')

/**
 * An XSLT processor which acts as a proxy to an instance of the
 * in-browser [`XSLTProcessor`](https://developer.mozilla.org/en-US/docs/Web/API/XSLTProcessor).
 */
export class Processor {
  /**
   * The Puppeteer page used to persist a `XSLTProcessor`
   */
  page?: puppeteer.Page

  /**
   * The default XML namespaces to use for XML content
   * begin transformed by this processor.
   */
  xmlns: Record<string, string>

  constructor(xmlns: Record<string, string> = {}) {
    this.xmlns = xmlns
  }

  /**
   * Create a `Processor` instance
   *
   * @param stylesheet The XSLT stylesheet to use
   * @param xmlns The default XML Namespace to use
   */
  static async create(
    stylesheet: string,
    xmlns: Record<string, string> = {}
  ): Promise<Processor> {
    const processor = new Processor(xmlns)

    // Set up the page context
    const page = (processor.page = await puppeteer.page())
    await page.setContent(`
<script>
  window.domParser = new DOMParser()
  window.xmlSerializer = new XMLSerializer()
  window.xsltProcessor = new XSLTProcessor()
</script>
`)
    /* istanbul ignore next */
    await page.evaluate(function (stylesheet: string) {
      // @ts-ignore properties set on window inside Puppeteer page context
      const { xsltProcessor, domParser } = window
      xsltProcessor.importStylesheet(
        domParser.parseFromString(stylesheet, 'text/xml')
      )
    }, stylesheet)

    return processor
  }

  /**
   * Transform some XML using the processor
   *
   * @param xml The XMl to transform
   */
  transform(xml: string): Promise<string> {
    if (this.page === undefined) {
      log.error('Processor not yet initialized')
      return Promise.resolve('')
    }
    /* istanbul ignore next */
    return this.page.evaluate(
      function (xml, xmlns) {
        // @ts-ignore properties set on window inside Puppeteer page context
        const { xsltProcessor, domParser, xmlSerializer } = window

        // Set the XML namespaces on wrapper
        const attrs = Object.entries(xmlns)
          .map(([key, value]) => {
            return `xmlns${key === '' ? '' : ':' + key}="${value}"`
          })
          .join(' ')
        const wrap = `<wrap ${attrs}>${xml}</wrap>`

        // Parse the input document and send back any errors
        const input = domParser.parseFromString(wrap, 'text/xml')
          .firstElementChild
        if (input === null) return `Error parsing XML: ${xml}`
        const error = input.querySelector('parsererror')
        if (error !== null) return error.textContent

        // Do the transformation
        const output = xsltProcessor.transformToDocument(input)
        if (output === null) return `Error transforming XML: ${xml}`

        // For stylesheets with <xsl:output method="text">, Chrome wraps the
        // result in a `<pre>` element
        const result = output.querySelector('pre')
        return result !== null
          ? result.textContent
          : xmlSerializer.serializeToString(output)
      },
      xml,
      this.xmlns
    )
  }
}

/**
 * Transform a XML document using a XSLT stylesheet.
 *
 * @param xml The XML document to transform
 * @param stylesheet The XSLT stylesheet to transform it with
 */
export async function transform(
  xml: string,
  stylesheet: string
): Promise<string> {
  const processor = await Processor.create(stylesheet)
  return processor.transform(xml)
}
