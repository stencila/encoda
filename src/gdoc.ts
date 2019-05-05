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

import * as stencila from '@stencila/schema'
import { docs_v1 as GDoc } from 'googleapis'
import { dump, load, VFile } from './vfile'

export const mediaTypes = ['application/vnd.google-apps.document']

/**
 * Parse a `VFile` with `gdoc` contents to a `stencila.Node`.
 *
 * @param file The `VFile` to parse
 * @returns A promise that resolves to a `stencila.Node`
 */
export async function parse(file: VFile): Promise<stencila.Node> {
  const json = dump(file)
  const gdoc = JSON.parse(json)
  return parseDocument(gdoc)
}

/**
 * Unparse a `stencila.Node` to a `VFile` with Markdown contents.
 *
 * @param node The `stencila.Node` to unparse
 * @returns A promise that resolves to a `VFile`
 */
export async function unparse(node: stencila.Node): Promise<VFile> {
  const gdoc = unparseArticle(node as stencila.Article)
  const json = JSON.stringify(gdoc, null, '  ')
  return load(json)
}

/**
 * Parse a GDoc `Document` to a Stencila `Article`
 *
 * Note that currently `SectionBreak`, `Table` and `TableOfContents`
 * child elements are ignored.
 */
function parseDocument(doc: GDoc.Schema$Document): stencila.Node {
  let content: Array<stencila.Node> = []
  let lists: { [key: string]: stencila.List } = {}
  if (doc.body && doc.body.content) {
    content = doc.body.content
      .map((elem: GDoc.Schema$StructuralElement) => {
        if (elem.paragraph) return parseParagraph(elem.paragraph, doc, lists)
        // else if (elem.sectionBreak) return undefined
        // else if (elem.table) return undefined
        // else if (elem.tableOfContents) return undefined
        else
          throw new Error(`Unhandled GDoc element type ${JSON.stringify(elem)}`)
      })
      .filter(node => typeof node !== 'undefined') as Array<stencila.Node>
  }
  return stencila.validate(
    {
      type: 'Article',
      title: doc.title,
      authors: [],
      content
    },
    'Article'
  )
}

/**
 * Unparse a Stencila `Article` to a GDoc `Document`
 */
function unparseArticle(article: stencila.Article): GDoc.Schema$Document {
  let content: Array<GDoc.Schema$StructuralElement> = []
  let lists: { [key: string]: GDoc.Schema$List } = {}
  if (article.content) {
    for (let node of article.content) {
      const type = stencila.type(node)
      switch (type) {
        case 'Heading':
          content.push(unparseHeading(node as stencila.Heading))
          break
        case 'Paragraph':
          content.push(unparseParagraph(node as stencila.Paragraph))
          break
        case 'List':
          content.push(...unparseList(node as stencila.List, lists))
          break
        default:
          throw new Error(`Unhandled Stencila node type ${type}`)
      }
    }
  }
  return {
    title: article.title || 'Untitled',
    body: {
      content
    },
    lists
  }
}

/**
 * Parse a GDoc `Paragraph` to a Stencila `Paragraph`, `Heading` or `List` node.
 */
function parseParagraph(
  para: GDoc.Schema$Paragraph,
  gdoc: GDoc.Schema$Document,
  lists: { [key: string]: stencila.List }
): stencila.Paragraph | stencila.Heading | stencila.List | undefined {
  let content: any[] = []
  if (para.elements) {
    content = para.elements.map((elem: GDoc.Schema$ParagraphElement) => {
      if (elem.textRun) return parseTextRun(elem.textRun)
      else throw new Error(`Unhandled element type ${JSON.stringify(elem)}`)
    })
  }

  if (para.paragraphStyle) {
    let styleType = para.paragraphStyle.namedStyleType
    if (styleType) {
      let match = styleType.match(/^HEADING_(\d)$/)
      if (match) {
        return {
          type: 'Heading',
          depth: parseInt(match[1], 10),
          content
        }
      }
    }
  }

  if (para.bullet) return parseList(para, content, gdoc, lists)

  return {
    type: 'Paragraph',
    content
  }
}

/**
 * Unparse a Stencila `Heading` to a GDoc `Paragraph` with a `HEADING_` style.
 */
function unparseHeading(
  heading: stencila.Heading
): GDoc.Schema$StructuralElement {
  const elem = unparseParagraph({
    type: 'Paragraph',
    content: heading.content
  })
  elem.paragraph!.paragraphStyle = {
    namedStyleType: `HEADING_${heading.depth}`
  }
  return elem
}

/**
 * Unparse a Stencila `Paragraph` to a GDoc `Paragraph`.
 */
function unparseParagraph(
  para: stencila.Paragraph
): GDoc.Schema$StructuralElement {
  return {
    paragraph: {
      elements: para.content.map(unparseInlineContent)
    }
  }
}

/**
 * Parse a GDoc list item paragraph (one with a `bullet`) to
 * a Stencila `List`.
 *
 * @returns A new `List` or undefined if the paragraph was
 *        added to an existing list.
 */
function parseList(
  para: GDoc.Schema$Paragraph,
  content: stencila.InlineContent[],
  gdoc: GDoc.Schema$Document,
  lists: { [key: string]: stencila.List }
): stencila.List | undefined {
  const bullet = para.bullet!
  const listId = bullet.listId
  if (!listId) throw new Error('Woaah, the bullet has no list id!')
  // If there is already a list with this id then add this paragraph to it
  const existingList = lists[listId]
  if (existingList) {
    existingList.items.push({ type: 'Paragraph', content })
    return undefined
  }
  // Create a new list with this paragraph as it's first item
  if (!gdoc.lists) throw new Error('WTF, the GDoc has no lists!')
  const list = gdoc.lists[listId].listProperties
  if (!(list && list.nestingLevels))
    throw new Error('OMG! That list id can`t be found')
  const level = list.nestingLevels[bullet.nestingLevel || 0]
  const order = level.glyphType ? 'ascending' : 'unordered'
  const newList: stencila.List = {
    type: 'List',
    order,
    items: [{ type: 'Paragraph', content }]
  }
  // Register the new list so other items can be added.
  lists[listId] = newList
  return newList
}

/**
 * Unparse a Stencila `List` to GDoc `Paragraph` elements with a `bullet`.
 */
function unparseList(
  list: stencila.List,
  lists: { [key: string]: GDoc.Schema$List }
): GDoc.Schema$StructuralElement[] {
  // Generate a unique list id based on the index of the new list
  // Ids are always prefixed with `kix.` (an old code name for GDocs)
  // followed by a unique string. We use the index here for reversability.
  const listId = 'kix.' + Object.keys(lists).length
  // Create a new list with this id
  lists[listId] = {
    listProperties: {
      nestingLevels: [
        {
          glyphType: list.order === 'ascending' ? '%0' : undefined
        }
      ]
    }
  }
  // Create the GDoc paragraphs with a bullet with the id
  const paras: GDoc.Schema$StructuralElement[] = list.items.map(item => {
    let para
    const type = stencila.type(item)
    if (type === 'Paragraph') {
      para = unparseParagraph(item as stencila.Paragraph)
    } else {
      throw new Error(`List item is unhandled Stencila node type "${type}"`)
    }
    para.paragraph!.bullet = { listId }
    return para
  })
  return paras
}

/**
 * Parse a GDoc `TextRun` to a `string`, `Strong` or `Emphasis` node.
 */
function parseTextRun(textRun: GDoc.Schema$TextRun): stencila.Node {
  let text = ''
  if (textRun.content) {
    let value = textRun.content
    if (value.endsWith('\n')) value = value.slice(0, -1)
    text = value
  }
  const textStyle = textRun.textStyle
  if (textStyle) {
    if (textStyle.bold) {
      return {
        type: 'Strong',
        content: [text]
      }
    }
    if (textStyle.italic) {
      return {
        type: 'Emphasis',
        content: [text]
      }
    }
  }
  return text
}

/**
 * Unparse a Stencila inline content node to a GDoc `ParagraphElement`
 */
function unparseInlineContent(
  node: stencila.InlineContent
): GDoc.Schema$ParagraphElement {
  const type = stencila.type(node)
  switch (type) {
    case 'Emphasis':
      return unparseEmphasis(node as stencila.Emphasis)
    case 'Strong':
      return unparseStrong(node as stencila.Strong)
    case 'string':
      return unparseString(node as string)
    default:
      throw new Error(`Unhandled node type ${type}`)
  }
}

/**
 * Stringify inline content nodes.
 *
 * This is necessary for elements like `TextRun` where the content must be
 * a simple string.
 */
function stringifyInlineContentNodes(nodes: stencila.InlineContent[]): string {
  return nodes
    .map(node => {
      const type = stencila.type(node)
      switch (type) {
        case 'Emphasis':
        case 'Strong':
          // @ts-ignore
          return node.content
        default:
          // @ts-ignore
          return node.toString()
      }
    })
    .join()
}

/**
 * Unparse a `stencila.Emphasis` node to a GDoc `TextRun` node with `textStyle.italic`.
 */
function unparseEmphasis(em: stencila.Emphasis): GDoc.Schema$ParagraphElement {
  return {
    textRun: {
      content: stringifyInlineContentNodes(em.content),
      textStyle: {
        italic: true
      }
    }
  }
}

/**
 * Unparse a `stencila.Strong` node to a GDoc `TextRun` node with `textStyle.bold`.
 */
function unparseStrong(strong: stencila.Strong): GDoc.Schema$ParagraphElement {
  return {
    textRun: {
      content: stringifyInlineContentNodes(strong.content),
      textStyle: {
        bold: true
      }
    }
  }
}

/**
 * Unparse a `string` to a GDoc `TextRun`.
 */
function unparseString(value: string): GDoc.Schema$ParagraphElement {
  return {
    textRun: {
      content: value
    }
  }
}
