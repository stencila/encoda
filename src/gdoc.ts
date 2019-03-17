
import {docs_v1 as docs} from 'googleapis'

//@ts-ignore
import {get} from './gdoc-resource'
import {unparse} from './md'
import * as vfile from './vfile'

// Proof-of-Concept conversion of a Google Doc to Markdown

get('1Myrnc68q0xwGHkJBwEIRpheQKiBbu0cqwQTi4DwHEj8').then(async (doc: docs.Schema$Document) => {
  //console.log(JSON.stringify(doc.body, null, '  '))
  
  const sast = gDocument2sDocument(doc)
  const file = vfile.create()
  await unparse(sast, file)

  console.log(file.contents)
})

/**
 * Convert a Google Doc `Document` element to a Stencila AST
 * 
 * @param gDoc The `Document` to convert
 */
function gDocument2sDocument (gDoc: docs.Schema$Document) {
  let body: Array<any> = []
  if (gDoc.body && gDoc.body.content) {
    body = gDoc.body.content.map((elem: docs.Schema$StructuralElement) => {
      if (elem.paragraph) return gParagraph2sast(elem.paragraph)
    }).filter(child => child)
  }
  return {
    type: 'Document',
    body: body
  }
}

/**
 * Convert a Google Doc `Paragraph` element to a Stencila AST
 * 
 * @param gPara The `Paragraph` to convert
 */
function gParagraph2sast (gPara: docs.Schema$Paragraph) {
  let children: Array<any> = []
  if (gPara.elements) {
    children = gPara.elements.map((elem: docs.Schema$ParagraphElement) => {
      if (elem.textRun) return gTextRun2sast(elem.textRun)
    }).filter(child => child)
  }
  if (gPara.paragraphStyle) {
    let styleType = gPara.paragraphStyle.namedStyleType
    if (styleType) {
      let match = styleType.match(/^HEADING_(\d)$/)
      if (match) {
        return {
          type: 'Heading',
          depth: match[1],
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
 * Convert a Google Doc `TextRun` element to a Stencila AST
 * 
 * @param gTextRun The `TextRun` to convert
 */
function gTextRun2sast (gTextRun: docs.Schema$TextRun) {
  const textStyle = gTextRun.textStyle
  if (textStyle) {
    if (textStyle.bold) {
      return {
        type: 'Strong',
        children: [{
          type: 'Text',
          value: gTextRun.content
        }]
      }
    }
    if (textStyle.italic) {
      return {
        type: 'Emphasis',
        children: [{
          type: 'Text',
          value: gTextRun.content
        }]
      }
    }
  }
  return {
    type: 'Text',
    value: gTextRun.content
  }
}
