/**
 * # Document Archive (DAR)
 *
 * @module dar
 */

/** A comment required for above to be included in docs.
 * See https://github.com/christopherthielen/typedoc-plugin-external-module-name/issues/300
 */

import stencila from '@stencila/schema'
import { isCreativeWork, isEntity, nodeType } from '@stencila/schema/dist/util'
import fs from 'fs-extra'
import h from 'hyperscript'
import produce from 'immer'
// @ts-ignore
import { html as beautifyHtml } from 'js-beautify'
import path from 'path'
import tempy from 'tempy'
import { Encode, EncodeOptions, write } from '../..'
import * as uri from '../../util/uri'
import * as vfile from '../../util/vfile'

export const mediaTypes = []

export const extNames = ['dar']

/**
 * A regex to test that a `manifest.xml` file
 * is a DAR manifest file.
 */
const MANIFEST_REGEX = /<dar>/

export async function sniff(content: string): Promise<boolean> {
  const manifestPath = path.join(content, 'manifest.xml')
  if (await fs.pathExists(manifestPath)) {
    const contents = await fs.readFile(manifestPath, 'utf8')
    return MANIFEST_REGEX.test(contents)
  }
  return false
}

/**
 * The media types to synced from the DAR to the execution context
 */
const MEDIA_TYPES_SYNCED = ['text/csv']

/**
 * Decode a `VFile` pointing to a DAR folder to a Stencila `Node`.
 *
 * If there is only one document in the DAR, then this function
 * will return an `Article`, otherwise it will return a `Collection`
 * with `parts`.
 *
 * @param file The `VFile` to decode
 * @returns A promise that resolves to a Stencila `Node`
 */
export async function decode(
  file: vfile.VFile
): Promise<stencila.Article | stencila.Collection> {
  throw new Error('TODO: Not yet implemented')
}

/**
 * Encode a Stencila `Node` to a `VFile` pointing to a DAR folder.
 *
 * @param node The Stencila `Node` to encode
 * @returns A promise that resolves to a `VFile`
 */
export const encode: Encode = async (
  node: stencila.Node,
  options = {}
): Promise<vfile.VFile> => {
  let { filePath } = options

  const darPath = filePath || path.join(tempy.directory(), '.dar')
  await fs.ensureDir(darPath)

  // Generate promises for each document and its assets
  const nodes =
    isCreativeWork(node) && node.type === 'Collection'
      ? node.parts || []
      : [node]
  const promises = nodes.map(async (node, index) => {
    const fileId =
      isEntity(node) && node.name
        ? node.name
        : `${nodeType(node).toLowerCase()}-${index}`
    if (isEntity(node) && node.type === 'Datatable') {
      const fileName = fileId + '.csv'
      const filePath = path.join(darPath, fileName)
      await write(node, filePath)
      const [h, asset] = await encodeAsset(filePath, fileId, darPath)
      return { document: null, assets: [asset] }
    } else {
      const { encoded, assets } = await encodeDocumentAssets(
        node,
        fileId,
        darPath
      )
      const document = await encodeDocument(encoded, fileId, darPath, options)
      return { document, assets }
    }
  })

  // Resolve all documents and assets into two lists
  const { documents, assets } = (await Promise.all(promises)).reduce(
    (prev: { documents: Element[]; assets: Element[] }, curr) => {
      return {
        documents: curr.document
          ? [...prev.documents, curr.document]
          : prev.documents,
        assets: [...prev.assets, ...curr.assets]
      }
    },
    {
      documents: [],
      assets: []
    }
  )

  // Generate manifest file
  const manifestPath = path.join(darPath, 'manifest.xml')
  const manifest = h('dar', h('documents', documents), h('assets', assets))
  const manifestXml = beautifyHtml(manifest.outerHTML)
  await fs.writeFile(manifestPath, manifestXml, 'utf8')

  return vfile.create(filePath)
}

/**
 * Encode a Stencila `Node` as a JATS file and return a `<document>` element
 * to put into the `manifest.xml` file of the DAR.
 */
async function encodeDocument(
  node: stencila.Node,
  id: string,
  darPath: string,
  options: EncodeOptions
): Promise<Element> {
  const documentFile = `${id}.jats.xml`
  const documentPath = path.join(darPath, documentFile)

  await write(node, documentPath, { ...options, format: 'jats' })

  const elem = h('document')
  elem.setAttribute('id', id)
  elem.setAttribute('type', 'article')
  elem.setAttribute('path', documentFile)
  return elem
}

/**
 * Encode any images or other resources in documents as assets in a DAR.
 *
 * Walks to Stencila `Node` and transforms any `MediaObject` nodes so
 * that they point to file assets within the DAR.
 */
async function encodeDocumentAssets(
  node: stencila.Node,
  docId: string,
  darPath: string
): Promise<{
  encoded: stencila.Node
  assets: Element[]
}> {
  const assets: Element[] = []
  async function walk(node: any): Promise<any> {
    if (node === null) return node
    if (typeof node !== 'object') return node

    switch (node.type) {
      case 'MediaObject':
      case 'AudioObject':
      case 'ImageObject':
      case 'VideoObject':
        const mediaObject = node as stencila.MediaObject
        const id = `${docId}-${assets.length}`
        const [contentUrl, asset] = await encodeAsset(
          mediaObject.contentUrl,
          id,
          darPath
        )
        assets.push(asset)
        return {
          ...mediaObject,
          contentUrl
        }
    }

    for (const [key, child] of Object.entries(node)) {
      node[key] = await walk(child)
    }
    return node
  }
  const encoded = produce(node, walk) as stencila.Node
  return { encoded, assets }
}

/**
 * Encode an asset to DAR.
 *
 * Copies asset into the DAR folder and returns its new
 * file name (within the DAR) (e.g. use to replace the existing `contentUrl`)
 * and an `<asset>` element to put into the `manifest.xml` file.
 */
async function encodeAsset(
  url: string,
  id: string,
  darPath: string
): Promise<[string, Element]> {
  const { name, ext } = path.parse(url)
  const assetFile = `${id}${ext}`
  const assetPath = path.join(darPath, assetFile)

  const { mediaType } = await uri.toFile(url, assetPath)
  const sync = MEDIA_TYPES_SYNCED.includes(mediaType)

  const elem = h('asset')
  elem.setAttribute('id', id)
  elem.setAttribute('type', mediaType)
  elem.setAttribute('path', assetFile)
  elem.setAttribute('sync', sync.toString())

  return [assetFile, elem]
}
