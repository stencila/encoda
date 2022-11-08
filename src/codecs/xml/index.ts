/**
 * [[include:src/codecs/xml/README.md]]
 *
 * @module codecs/xml
 */

import { getLogger } from '@stencila/logga'
import schema from '@stencila/schema'
import * as vfile from '../../util/vfile'
import * as xml from '../../util/xml'
import { Codec, CommonEncodeOptions } from '../types'

const log = getLogger('encoda:xml')

export class XmlCodec extends Codec {
  /**
   * The media types that this codec can decode/encode.
   */
  public readonly mediaTypes = ['application/xml']

  // The above media type is registered in the `mime` module
  // so there is no need to specify `extNames`

  /**
   * Decode a `VFile` with XML content to a Stencila `Node`.
   *
   * @param file The `VFile` to decode
   * @returns A promise that resolves to a Stencila `Node`
   */
  public readonly decode = async (file: vfile.VFile): Promise<schema.Node> => {
    const content = await vfile.dump(file)
    let doc
    try {
      doc = xml.load(content)
    } catch (error) {
      log.error(error as Error)
      return null
    }
    const node = decodeDoc(doc)
    if (node === undefined) {
      log.error(`Unable to parse content as Stencila XML`)
      return null
    }
    return decodeDoc(doc)
  }

  /**
   * Encode a Stencila `Node` to a `VFile` with XML content.
   *
   * @param thing The Stencila `Node` to encode
   * @returns A promise that resolves to a `VFile`
   */
  public readonly encode = (
    node: schema.Node,
    options: CommonEncodeOptions = this.commonEncodeDefaults
  ): Promise<vfile.VFile> => {
    const doc = encodeDoc(node, options.isStandalone)
    const content = xml.dump(doc, { spaces: 4 })
    return Promise.resolve(vfile.load(content))
  }
}

/**
 * Decode an XML document to a Stencila `Node`
 *
 * @param doc The top level XML element to decode
 */
export const decodeDoc = (doc: xml.Element): schema.Node => {
  const stencila = xml.first(doc, 'stencila')
  if (stencila?.elements !== undefined && stencila.elements.length === 1) {
    const root = stencila.elements[0]
    return decodeElem(root)
  } else {
    log.error('Unable to decode XML document')
    return null
  }
}

/**
 * Encode a `Node` as an XML document
 *
 * @param node The `Node` to encode
 * @param standalone Should the document be a standalone XML document?
 */
export const encodeDoc = (
  node: schema.Node,
  standalone = false
): xml.Element => {
  const root = encodeNode(node)

  const stencila = xml.elem(
    'stencila',
    {
      xmlns: `https://schema.stenci.la/v1/xml`,
    },
    root
  )

  return {
    elements: [stencila],
    ...(standalone
      ? {
          declaration: {
            attributes: {
              version: '1.0',
              encoding: 'utf-8',
            },
          },
        }
      : {}),
  }
}

/**
 * Decode an XML element to a Stencila `Node`
 *
 * @param elem The XML element to decode
 */
export const decodeElem = (elem: xml.Element): schema.Node => {
  const { name, elements = [] } = elem
  switch (name) {
    case 'Null':
      return null
    case 'Boolean':
      return xml.text(elem) === 'true'
    case 'Number':
      return parseFloat(xml.text(elem))
    case 'String':
      return xml.text(elem)
    case 'Array':
      return elements.map(decodeElem)
    default: {
      const node = elements.reduce((prev, curr) => {
        const key = xml.attr(curr, 'key') ?? ''
        return {
          ...prev,
          [key]: decodeElem(curr),
        }
      }, {})
      return name === 'Object' ? node : { type: name, ...node }
    }
  }
}

/**
 * Encode a `Node` as an XML element.
 *
 * This is a recursive function which walks, depth-first
 * the node tree, converting each node to an XML element.
 *
 * @param node The node to encode
 * @param key The `key` attribute to be added to the element
 */
export const encodeNode = (node: schema.Node, key?: string): xml.Element => {
  const type = schema.nodeType(node)
  if (node === null) {
    return xml.elem(type, { key })
  }
  if (type === 'Boolean' || type === 'Number' || type === 'String') {
    return xml.elem(type, { key }, node.toString())
  }
  if (type === 'Array') {
    const array = node as schema.Node[]
    const items = array.map((node) => encodeNode(node))
    return xml.elem(type, { key }, ...items)
  }
  const props = Object.entries(node)
    .filter(([key]) => key !== 'type')
    .map(([key, value]) => encodeNode(value, key))
  return xml.elem(type, { key }, ...props)
}
