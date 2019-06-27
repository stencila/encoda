/**
 * # Document Archive (DAR)
 *
 * @module dar
 */

/** A comment required for above to be included in docs.
 * See https://github.com/christopherthielen/typedoc-plugin-external-module-name/issues/300
 */

import { getLogger } from '@stencila/logga'
import stencila from '@stencila/schema'
import fs from 'fs-extra'
import h from 'hyperscript'
import produce from 'immer'
// @ts-ignore
import { html as beautifyHtml } from 'js-beautify'
import mime from 'mime'
import path from 'path'
import tempy from 'tempy'
import { Encode, EncodeOptions, write } from '../..'
import { RequireSome } from '../../util/type'
import * as vfile from '../../util/vfile'

const logger = getLogger('encoda:dar')

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

/* DAR codec specific options */
interface DarOptions {
  documentId: number
}

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
export const encode: Encode<DarOptions> = async (
  node: stencila.Node,
  options = {}
): Promise<vfile.VFile> => {
  let { filePath } = options

  const darPath = filePath ? filePath : path.join(tempy.directory(), '.dar')
  await fs.ensureDir(darPath)

  // Generate promises for each document and its assets
  const promises = [node].map(async (node, index) => {
    const { encoded, assets } = await encodeAssets(node, darPath, index)
    const document = await encodeDocument(encoded, {
      filePath: darPath,
      codecOptions: {
        documentId: index
      }
    })
    return { document, assets }
  })

  // Resolve all documents and assets into two lists
  const { documents, assets } = (await Promise.all(promises)).reduce(
    (prev: { documents: Element[]; assets: Element[] }, curr) => {
      return {
        documents: [...prev.documents, curr.document],
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

type EncodeDarOptions = RequireSome<
  EncodeOptions<DarOptions>,
  'filePath' | 'codecOptions'
>

/**
 * Encode a Stencila `Node` as a JATS file and return a `<document>` element
 * to put into the `manifest.xml` file of the DAR.
 */
async function encodeDocument(
  node: stencila.Node,
  options: EncodeDarOptions
): Promise<Element> {
  const { filePath, codecOptions, ...rest } = options
  const id = `d${codecOptions.documentId}`
  const documentFile = `${id}.jats.xml`
  const documentPath = path.join(filePath, documentFile)

  await write(node, documentPath, { format: 'jats', ...rest })

  const elem = h('document')
  elem.setAttribute('type', 'article')
  elem.setAttribute('id', id)
  elem.setAttribute('path', documentFile)
  return elem
}

/**
 * Encode any images or other resources in documents as assets in a DAR.
 *
 * Walks to Stencila `Node` and transforms any `MediaObject` nodes so
 * that they point to file assets within the DAR.
 */
async function encodeAssets(
  node: stencila.Node,
  darPath: string,
  document: number
): Promise<{
  encoded: stencila.Node
  assets: Element[]
}> {
  const promises: Promise<Element>[] = []
  function walk(node: any) {
    if (node === null) return node
    if (typeof node !== 'object') return node

    switch (node.type) {
      case 'MediaObject':
      case 'AudioObject':
      case 'ImageObject':
      case 'VideoObject':
        const mediaObject = node as stencila.MediaObject
        const [contentUrl, promise] = encodeAsset(
          mediaObject.contentUrl,
          darPath,
          document,
          promises.length
        )
        promises.push(promise)
        return {
          ...mediaObject,
          contentUrl
        }
    }

    for (const [key, child] of Object.entries(node)) {
      node[key] = walk(child)
    }
    return node
  }
  const encoded = produce(node, walk) as stencila.Node
  const assets = await Promise.all(promises)
  return { encoded, assets }
}

/**
 * Encode an asset to DAR.
 *
 * Copies asset into the DAR folder and returns its new
 * file name (within the DAR) to replace the existing `contentUrl`
 * and an `<asset>` element to put into the `manifest.xml` file.
 */
function encodeAsset(
  url: string,
  darPath: string,
  document: number,
  asset: number
): [string, Promise<Element>] {
  const id = `d${document}-a${asset}`
  const { base, ext } = path.parse(url)
  const assetFile = `${id}-${base}`
  const assetPath = path.join(darPath, assetFile)

  const mediaType = mime.getType(ext) || ''
  const sync = MEDIA_TYPES_SYNCED.includes(mediaType)

  let promise = (async () => {
    if (url.startsWith('http')) {
      logger.error('TODO: storage of remote resources not implemented')
    } else {
      await fs.copyFile(url, assetPath)
    }

    const elem = h('asset')
    elem.setAttribute('id', id)
    elem.setAttribute('type', mediaType)
    elem.setAttribute('path', assetFile)
    elem.setAttribute('sync', sync.toString())
    return elem
  })()

  return [assetFile, promise]
}
