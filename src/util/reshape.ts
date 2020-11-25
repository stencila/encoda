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
  const newContent: schema.CreativeWork['content'] = []

  const titleStyles = ['title']
  const codeStyles = ['code', 'code block']
  const tableCaptionStyles = ['table caption', 'table', 'caption']
  const figureCaptionStyles = ['figure caption', 'figure', 'caption']

  for (let index = 0; index < content.length; index++) {
    const prev = newContent[newContent.length - 1]
    let node: schema.Node | undefined = content[index]
    const next = content[index + 1]

    const text = textContent(node)
    //console.log(text.substr(0, 50))

    // Is this the first node and does it want to be the work's title?
    if (
      work.title === undefined &&
      index == 0 &&
      (schema.isA('Heading', node) ||
        (schema.isA('Paragraph', node) &&
          (hasStyle(node, titleStyles), isEmphasis(node) || isStrong(node))))
    ) {
      // Title becomes content of the block content node
      work = { ...work, title: removeMark(node.content) }
    }

    // Is this the authors list paragraph?
    else if (
      work.authors === undefined &&
      newContent.length == 0 &&
      schema.isA('Paragraph', node) &&
      node.content.filter(schema.is('Superscript')).length > 0
    ) {
      const affiliations = new Map<schema.Person, string[]>()

      const parsed = await Promise.all(
        text.split(/\s*,\s*/).map(async (text) => {
          text = text.trim()
          // If the text end in a number, assume that is the superscripted
          // affiliation and split it off.
          let orgId
          if (/\d$/.test(text)) {
            orgId = text.slice(-1)
            text = text.slice(0, -1)
          }
          // Spread the person to allow it us to update it's affiliations below.
          const { ...person } = await decodePerson(text)
          if (orgId) affiliations.set(person, [orgId])
          return person
        })
      )

      const authors = parsed.filter(
        (person) => person.familyNames !== undefined
      )

      if (authors.length > 0) {
        // Look ahead for following affiliations paragraphs that begin with
        // a number.
        let step = 1
        while (true) {
          const following = content[index + step]
          const followingText = textContent(following)
          const match = /^(\d+)(.*)/.exec(followingText)
          if (match) {
            const [_, orgId, name] = match
            const org = schema.organization({ name })
            for (const author of authors) {
              if (affiliations.get(author)?.includes(orgId))
                author.affiliations =
                  author.affiliations === undefined
                    ? [org]
                    : [...author.affiliations, org]
            }
          } else break
          step++
        }
        index += step - 1
      }

      // Only use this as authors list if we have been able to parse at least one author
      if (authors.length > 0) {
        work = { ...work, authors }
        node = undefined
      }
    }

    // If this is an "Abstract" heading then collect the following into it
    // Allows for a heading that is a `Heading`, `Paragraph`, even a `List`,
    // as long as it matches the regex
    else if (
      work.description === undefined &&
      schema.isBlockContent(node) &&
      /^Abstract\s*$/i.test(text)
    ) {
      const description = [] as schema.BlockContent[]
      // Merge the following paragraphs until a "header" like node
      let step = 1
      while (true) {
        const following = content[index + step]
        if (
          schema.isA('Paragraph', following) &&
          !(schema.isA('Heading', following) || isStrong(following))
        ) {
          description.push(following)
        } else break
        step++
      }
      if (description.length > 0) work = { ...work, description }

      node = undefined
      index += step - 1
    }

    // Is this a "property" paragraph?
    else if (/^[a-z]+\s*:\s*/i.test(text)) {
      const text = textContent(node)
      const [first, value] = text.split(':').map((part) => part.trim())
      const name = first.toLowerCase()
      if (work.keywords === undefined && name === 'keywords') {
        work = { ...work, keywords: value.split(/\s*,|;\s*/) }
      }

      node = undefined
    }

    // Is this a `CodeBlock` disguised as contiguous paragraphs?
    else if (schema.isA('Paragraph', node) && hasStyle(node, codeStyles)) {
      let text = textContent(node)
      // Attempt to merge as many as possible of following paragraphs into
      // the same code block
      let step = 1
      while (true) {
        const following = content[index + step]
        if (
          schema.isA('Paragraph', following) &&
          hasStyle(following, codeStyles)
        ) {
          text += '\n' + textContent(following)
        } else break
        step++
      }

      node = schema.codeBlock({ text })
      index += step - 1
    }

    // Is this a `Table` in search of a caption?
    else if (schema.isA('Table', node) && node.caption === undefined) {
      let captionPara: schema.Paragraph | undefined
      const captionRegex = /^Table\s+\d+\s*[.:]/i
      if (
        schema.isA('Paragraph', prev) &&
        (captionRegex.test(textContent(prev)) ||
          hasStyle(prev, tableCaptionStyles) ||
          isEmphasis(prev) ||
          isStrong(prev))
      ) {
        // Make previous paragraph the table caption
        captionPara = prev
        newContent.pop()
      } else if (
        schema.isA('Paragraph', next) &&
        (captionRegex.test(textContent(next)) ||
          hasStyle(next, tableCaptionStyles) ||
          isEmphasis(next) ||
          isStrong(next))
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
        caption: caption ?? node.caption,
      }
    }

    // Is this a `Figure` disguised as a Paragraph` with a single media object in it?
    else if (
      schema.isA('Paragraph', node) &&
      node.content.length === 1 &&
      (schema.isA('ImageObject', node.content[0]) ||
        schema.isA('VideoObject', node.content[0]))
    ) {
      // Attempt to find a caption
      let captionPara: schema.Paragraph | undefined
      const captionRegex = /^Figure\s+\d+\s*[.:]/i
      if (
        schema.isA('Paragraph', prev) &&
        (captionRegex.test(textContent(prev)) ||
          hasStyle(prev, figureCaptionStyles) ||
          isEmphasis(prev) ||
          isStrong(prev))
      ) {
        // Make previous paragraph the figure's caption
        captionPara = prev
        newContent.pop()
      } else if (
        schema.isA('Paragraph', next) &&
        (captionRegex.test(textContent(next)) ||
          hasStyle(next, figureCaptionStyles) ||
          isEmphasis(next) ||
          isStrong(next))
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
        caption,
      })
    }

    // If node (or it's replacement) is bibliography heading and the article
    // does not have any references...make em!
    if (
      work.references === undefined &&
      schema.isA('Heading', node) &&
      /^references|bibliography\s*$/i.test(text)
    ) {
      // Attempt to parse each following paragraph as a reference and
      // add to article references.
      const references = []
      let promises = []
      let step = 1
      while (true) {
        const following = content[index + step]
        if (schema.isA('Paragraph', following)) {
          let text = textContent(following)

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
        references,
      }

      node = undefined
      index += step - 1
    }

    if (node !== undefined) newContent.push(node)
  }

  return {
    ...work,
    content: newContent.length > 0 ? newContent : undefined,
  }
}

/**
 * Get the text content of a node.
 *
 * This is similar to `TxtCodec.stringify` but does not
 * stringify arbitrary properties e.g a heading `depth`,
 * it only shows what is "visible". Trims whitespace.
 */
function textContent(node: schema.Node): string {
  if (node === null) return ''
  if (typeof node === 'string') return node.trim()
  if (Array.isArray(node)) return node.map(textContent).join(' ')
  if (typeof node === 'object') {
    if ('text' in node && typeof node.text == 'string') return node.text.trim()
    if ('content' in node && Array.isArray(node.content))
      return node.content.map(textContent).join('')
    if ('items' in node && Array.isArray(node.items))
      return node.items.map(textContent).join(' ')
  }
  return node.toString()
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

function removeMark(content: schema.InlineContent[]): schema.InlineContent[] {
  const first = content[0]
  if (schema.isA('Emphasis', first) || schema.isA('Strong', first)) {
    return [...first.content, ...content.slice(1)]
  }
  return content
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
  let content = removeMark(caption.content)

  // Attempt to get label and remove it from the caption
  let label: string | undefined
  const first = content[0]
  if (typeof first === 'string') {
    const match = new RegExp(
      '^\\s*(' + type + '\\s*\\d+)\\s*[.:;]?\\s(.*)'
    ).exec(first)
    if (match) {
      label = match[1]
      content = [match[2], ...content.slice(1)]
    }
  }
  return [label, [schema.paragraph({ ...removeStyle(caption), content })]]
}

// Just-in-time instantiated codec.
// These need to be synamically imported due to circular imports.
let personCodec: unknown
let doiCodec: unknown
let crossrefCodec: unknown

/**
 * Decode a string to a `Person`.
 */
function decodePerson(text: string): Promise<schema.Person> {
  if (personCodec === undefined) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { PersonCodec } = require('../codecs/person')
    personCodec = new PersonCodec()
  }
  // @ts-ignore
  return personCodec.load(text)
}

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
