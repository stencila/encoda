import * as schema from '@stencila/schema'

/**
 * Reshape a node by inferring its semantic structure.
 *
 * Most often used on a `CreativeWork` to do things like infer
 * `title`, `authors`, `references` etc from its `content`.
 */
export function reshape(node: schema.Node): schema.Node {
  if (schema.isCreativeWork(node)) {
    return reshapeCreativeWork(node)
  }
  return node
}

/**
 * Reshapes a `CreativeWork` node.
 */
async function reshapeCreativeWork(
  work: schema.CreativeWork
): Promise<schema.CreativeWork> {
  const { content = [] } = work

  const newContent: schema.Node[] = []
  for (let index = 0; index < content.length; index++) {
    const prev = newContent[newContent.length - 1]
    let node: schema.Node | undefined = content[index]
    const next = content[index + 1]

    const codeStyles = ['code', 'code block']
    if (schema.isA('Paragraph', node) && hasStyle(node, codeStyles)) {
      let text = asString(node)
      // Attempt to merge as many as possible of following paragraphs into
      // the same code block
      let step = 1
      while (true) {
        const following = content[index + step]
        if (
          schema.isA('Paragraph', following) &&
          hasStyle(following, codeStyles)
        ) {
          text += '\n' + asString(following)
        } else break
        step++
      }
      node = schema.codeBlock({ text })
      index += step - 1
    } else if (schema.isA('Table', node) && node.caption === undefined) {
      // Attempt to add a caption and label
      let captionPara: schema.Paragraph | undefined
      const captionStyles = ['table caption', 'table', 'caption']
      if (
        schema.isA('Paragraph', prev) &&
        (hasStyle(prev, captionStyles) || isEmphasis(prev) || isStrong(prev))
      ) {
        // Make previous paragraph the table caption
        captionPara = prev
        newContent.pop()
      } else if (
        schema.isA('Paragraph', next) &&
        (hasStyle(next, captionStyles) || isEmphasis(next) || isStrong(next))
      ) {
        // Make the next paragraph the table caption
        captionPara = next
        index++
      }

      // Separate figure label and caption
      const [label, caption] = separateLabelCaption(captionPara, 'Table')

      node = {
        ...node,
        label: label ?? node.label,
        caption: caption ?? node.caption
      }
    } else if (
      schema.isA('Paragraph', node) &&
      node.content.length === 1 &&
      (schema.isA('ImageObject', node.content[0]) ||
        schema.isA('VideoObject', node.content[0]))
    ) {
      // Attempt to find a caption
      let captionPara: schema.Paragraph | undefined
      const captionStyles = ['figure caption', 'figure', 'caption']
      if (
        schema.isA('Paragraph', prev) &&
        (hasStyle(prev, captionStyles) || isEmphasis(prev) || isStrong(prev))
      ) {
        // Make previous paragraph the figure's caption
        captionPara = prev
        newContent.pop()
      } else if (
        schema.isA('Paragraph', next) &&
        (hasStyle(next, captionStyles) || isEmphasis(next) || isStrong(next))
      ) {
        // Make the next paragraph the figure's caption
        captionPara = next
        index++
      }

      // Separate figure label and caption
      const [label, caption] = separateLabelCaption(captionPara, 'Figure')

      // Transform into a Figure
      node = schema.figure({
        content: node.content,
        label,
        caption
      })
    }

    // If node (or it's replacement) is bibliography heading and the article
    // does not have any references...
    if (
      schema.isA('Heading', node) &&
      ['references', 'bibliography'].includes(asString(node).toLowerCase()) &&
      (work.references === undefined || work.references?.length === 0)
    ) {
      // Attempt to parse each following paragraph as a reference and
      // add to article references.
      const references = []
      let promises = []
      let step = 1
      while (true) {
        const following = content[index + step]
        if (schema.isA('Paragraph', following)) {
          let text = asString(following)

          // Remove leading numbers etc (if any)
          text = text.replace(/^\s*\d+\s*[.,:;]*\s*/, '')

          // Look for a DOI
          const match = /\b((DOI\s*:?\s*)|(https?:\/\/doi\.org\/))?(10.\d{4,9}\/[^\s]+)/i.exec(
            text
          )
          if (match) {
            // Remove trailing punctuation (if any)
            let doi = match[4]
            if (doi.endsWith('.') || doi.endsWith(',')) doi = doi.slice(0, -1)

            promises.push(decodeDoi(doi, text))
          } else {
            promises.push(decodeCrossref(text))
          }
        } else break
        step++

        // Limit the number of inflight requests to 10
        // Avoids this warning https://github.com/sindresorhus/got/issues/1523
        if (promises.length >= 10) {
          references.push(
            ...((await Promise.all(promises)) as schema.CreativeWork[])
          )
          promises = []
        }
      }
      // Resolve remaining promises
      references.push(
        ...((await Promise.all(promises)) as schema.CreativeWork[])
      )

      work = {
        ...work,
        references
      }

      node = undefined
      index += step - 1
    }

    if (node !== undefined) newContent.push(node)
  }

  return { ...work, content: newContent.length > 0 ? newContent : undefined }
}

function hasStyle(node: schema.BlockContent, styles: string[]): boolean {
  const style = node.meta?.style as string
  return typeof style === 'string' && styles.includes(style.toLowerCase())
}

function removeStyle(node: schema.BlockContent): schema.BlockContent {
  if (node.meta && 'style' in node.meta) {
    const { style, ...rest } = node.meta
    return Object.keys(rest).length > 0
      ? { ...node, meta: rest }
      : { ...node, meta: undefined }
  }
  return node
}

function isEmphasis(node: schema.BlockContent): boolean {
  return 'content' in node && schema.isA('Emphasis', node.content?.[0])
}

function isStrong(node: schema.BlockContent): boolean {
  return 'content' in node && schema.isA('Strong', node.content?.[0])
}

function asString(node: schema.Node): string {
  return node !== null && typeof node === 'object' && 'content' in node
    ? (node.content ?? []).map(asString).join('')
    : node?.toString()
}

/**
 * Separate the `label` and `caption` properties from a paragraph
 * which has been identified as a "caption" paragraph for a table
 * or figure.
 */
function separateLabelCaption(
  caption: schema.Paragraph | undefined,
  type = 'Figure|Table'
): [string | undefined, [schema.Paragraph] | undefined] {
  if (caption === undefined) return [undefined, undefined]

  // De-emphasize the caption if necessary
  let first = caption.content[0]
  if (schema.isA('Emphasis', first) || schema.isA('Strong', first)) {
    caption = {
      ...caption,
      content: [...first.content, ...caption.content.slice(1)]
    }
  }

  // Attempt to get label and remove it from the caption
  let label: string | undefined
  first = caption.content[0]
  if (typeof first === 'string') {
    const match = new RegExp(
      '^\\s*(' + type + '\\s*\\d+)\\s*[.:;]?\\s(.*)'
    ).exec(first)
    if (match) {
      label = match[1]
      caption = { ...caption, content: [match[2], ...caption.content.slice(1)] }
    }
  }
  return [label, [removeStyle(caption) as schema.Paragraph]]
}

// Just-in-time instantiated codec.
// `DoiCodec` can't be imported due to circular imports.
let doiCodec: unknown

/**
 * Decode a DOI string to a `CreativeWork`, falling back to
 * doing a Crossref bibliographic query if that fails.
 */
function decodeDoi(
  doi: string,
  text: string
): Promise<schema.CreativeWork | string> {
  if (doiCodec === undefined) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { DoiCodec } = require('../codecs/doi')
    doiCodec = new DoiCodec()
  }
  // @ts-ignore
  return doiCodec.load(doi).catch(() => decodeCrossref(text))
}

// Just-in-time instantiated codec.
// See note above for `doiCodec`
let crossrefCodec: unknown

/**
 * Decode a reference string to a `CreativeWork` using a Crossref
 * bibliographic query, falling back to using the raw string as
 * the reference.
 */
function decodeCrossref(text: string): Promise<schema.CreativeWork | string> {
  if (crossrefCodec === undefined) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { CrossrefCodec } = require('../codecs/crossref')
    crossrefCodec = new CrossrefCodec()
  }
  // @ts-ignore
  return crossrefCodec
    .load(text)
    .then((result: schema.Node) => {
      if (result === null) throw new Error('Not found')
      return result
    })
    .catch(() => text)
}
