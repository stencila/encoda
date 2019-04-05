
/**
 * A compiler for Google Documents (GDoc).
 *
 * This compiler parses from, and unparses to, the GDoc JSON ('application/vnd.google-apps.document')
 * as defined as [JSON Schemas here](https://docs.googleapis.com/$discovery/rest?version=v1) and in
 * [Typescript here](https://github.com/googleapis/google-api-nodejs-client/blob/master/src/apis/docs/v1.ts)
 *
 * See also the [guide on the structure](https://developers.google.com/docs/api/concepts/structure)
 * of a GDoc.
 *
 * It is possible to get this JSON using the Google Docs API [`get`](https://developers.google.com/docs/api/reference/rest/v1/documents/get) method.
 * However, it is not possible to `POST` i.e. upload the JSON. The [`create`](https://developers.google.com/docs/api/reference/rest/v1/documents/create) method
 * only creates a **blank** document:
 *
 * > Creates a blank document using the title given in the request.
 * > Other fields in the request, **including any provided content, are ignored**.
 *
 * There are two other possibilities for creating a GDoc from content:
 *
 * 1. Use the Google Drive API [`import` method](https://developers.google.com/drive/api/v3/manage-uploads#import_to_google_docs_types_) to upload content such as HTML.
 * 2. Use Google [App Script API](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/google-apps-script/google-apps-script.document.d.ts)
 *    to walk Stencila JSON and build up the GDoc by calling methods such as `Body.appendParagraph` etc.
 */

import { docs_v1 as GDoc } from 'googleapis'
import { VFile } from 'vfile'

import * as SAST from './sast'

export const media = [
  'application/vnd.google-apps.document',

  'gdoc'
]

/**
 * Parse GDoc JSON into a Stencila document node
 *
 * @param file The `VFile` to parse
 * @returns The root of the document
 */
export async function parse (file: VFile): Promise<SAST.Node> {
  const json = file.contents.toString()
  const gdoc = JSON.parse(json)
  return parseDocument(gdoc)
}

/**
 * Unparse a Stencila document node to GDoc JSON.
 *
 * @param node The document node to unparse
 * @param file The `VFile` to unparse to
 */
export async function unparse (node: SAST.Node, file: VFile): Promise<void> {
  const gdoc = unparseDocument(node)
  const json = JSON.stringify(gdoc, null, '  ')
  file.contents = json
}

/**
 * Parse a GDoc `Document` to a Stencila `Document`
 *
 * Note that currently `SectionBreak`, `Table` and `TableOfContents`
 * child elements are ignored
 */
function parseDocument (gdoc: GDoc.Schema$Document): SAST.Node {
  let body: Array<any> = []
  if (gdoc.body && gdoc.body.content) {
    body = gdoc.body.content.map((elem: GDoc.Schema$StructuralElement) => {
      if (elem.paragraph) return parseParagraph(elem.paragraph)
      else if (elem.sectionBreak) return undefined
      else if (elem.table) return undefined
      else if (elem.tableOfContents) return undefined
      else throw new Error(`Unhandled element type ${JSON.stringify(elem)}`)
    }).filter(child => child !== undefined)
  }
  return {
    type: 'Document',
    body: body
  }
}

/**
 * Unparse a Stencila `Document` to a GDoc `Document`
 */
function unparseDocument (sDoc: SAST.Node): GDoc.Schema$Document {
  let content: Array<GDoc.Schema$StructuralElement> = []
  if (sDoc.body) {
    content = sDoc.body.map((node: SAST.Node) => {
      switch (node.type) {
        // These need to be GDoc.Schema$StructuralElement nodes
        case 'Heading': return { paragraph: unparseHeading(node) }
        case 'Paragraph': return { paragraph: unparseParagraph(node) }
        default: throw new Error(`Unhandled node type ${node.type}`)
      }
    })
  }
  return {
    body: {
      content
    }
  }
}

/**
 * Parse a GDoc `Paragraph` to a Stencila `Paragraph` or `Heading` node.
 */
function parseParagraph (gPara: GDoc.Schema$Paragraph): SAST.Node {
  let children: Array<any> = []
  if (gPara.elements) {
    children = gPara.elements.map((elem: GDoc.Schema$ParagraphElement) => {
      if (elem.textRun) return parseTextRun(elem.textRun)
      else throw new Error(`Unhandled element type ${JSON.stringify(elem)}`)
    })
  }
  if (gPara.paragraphStyle) {
    let styleType = gPara.paragraphStyle.namedStyleType
    if (styleType) {
      let match = styleType.match(/^HEADING_(\d)$/)
      if (match) {
        return {
          type: 'Heading',
          depth: parseInt(match[1]),
          children
        }
      }
    }
  }
  return {
    type: 'Paragraph',
    children
  }
}

/**
 * Unparse a Stencila `Heading` to a GDoc `Paragraph` with a `HEADING_` style.
 */
function unparseHeading (sHeading: SAST.Node): GDoc.Schema$Paragraph {
  const gPara = unparseParagraph(sHeading)
  gPara.paragraphStyle = { namedStyleType: `HEADING_${sHeading.depth}` }
  return gPara
}

/**
 * Unparse a Stencila `Paragraph` to a GDoc `Paragraph`.
 */
function unparseParagraph (sPara: SAST.Node): GDoc.Schema$Paragraph {
  let elements: Array<GDoc.Schema$ParagraphElement> = []
  if (sPara.children) {
    elements = sPara.children.map((node: SAST.Node) => {
      switch (node.type) {
        case 'Emphasis': return { textRun: unparseEmphasis(node) }
        case 'Strong': return { textRun: unparseStrong(node) }
        case 'Text': return { textRun: unparseText(node) }
        default: throw new Error(`Unhandled node type ${node.type}`)
      }
    })
  }
  return {
    elements
  }
}

/**
 * Parse a GDoc `TextRun` to a Stencila `Text` node.
 */
function parseTextRun (gTextRun: GDoc.Schema$TextRun): SAST.Node {
  let text = {
    type: 'Text',
    value: ''
  }
  if (gTextRun.content) {
    let value = gTextRun.content
    if (value.endsWith('\n')) value = value.slice(0, -1)
    text.value = value
  }
  const textStyle = gTextRun.textStyle
  if (textStyle) {
    if (textStyle.bold) {
      return {
        type: 'Strong',
        children: [text]
      }
    }
    if (textStyle.italic) {
      return {
        type: 'Emphasis',
        children: [text]
      }
    }
  }
  return text
}

/**
 * Unparse a Stencila `Emphasis` node to a GDoc `TextRun` node with `textStyle`.
 */
function unparseEmphasis (sEmphasis: SAST.Node): GDoc.Schema$TextRun {
  return {
    content: sEmphasis.children.map((child: SAST.Node) => child.value).join(),
    textStyle: {
      italic: true
    }
  }
}

/**
 * Unparse a Stencila `Strong` node to a GDoc `TextRun` node with `textStyle`.
 */
function unparseStrong (sStrong: SAST.Node): GDoc.Schema$TextRun {
  return {
    content: sStrong.children.map((child: SAST.Node) => child.value).join(),
    textStyle: {
      bold: true
    }
  }
}

/**
 * Unparse a Stencila `Text` node to a GDoc `TextRun` node.
 */
function unparseText (sText: SAST.Node): GDoc.Schema$TextRun {
  return {
    content: sText.value
  }
}
