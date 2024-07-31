import schema from '@stencila/schema'
import { transformSync } from './transform'
import {
  hasContent,
  isInlineContentArray,
} from '../util/content/isContentArray'

/**
 * Reshape a node by inferring its semantic structure.
 *
 * Most often used on a `CreativeWork` to do things like infer
 * `title`, `authors`, `references` etc from its `content`.
 */
export function reshape(node: schema.Node): Promise<schema.Node> {
  if (schema.isIn('CreativeWorkTypes', node)) return reshapeCreativeWork(node)
  return Promise.resolve(node)
}

/**
 * Reshapes a `CreativeWork` node.
 *
 * Previously `reshapeCites` was implicitly `true` but led to changes/loss of
 * punctuation that was unexpected for some users. This may be made into a
 * configuration option in the future.
 */
async function reshapeCreativeWork(
  work: schema.CreativeWork,
  reshapeCites = false,
): Promise<schema.CreativeWork> {
  const { content = [] } = work
  const newContent: schema.BlockContent[] = []

  const titleStyles = ['title']
  const codeStyles = ['code', 'code block']
  const tableCaptionStyles = ['table caption', 'table', 'caption']
  const figureCaptionStyles = ['figure caption', 'figure', 'caption']
  const chunkCaptionStyles = [
    'table caption',
    'figure caption',
    'table',
    'figure',
    'caption',
  ]

  for (let index = 0; index < content.length; index++) {
    const prev = newContent[newContent.length - 1]
    let node: schema.Node | undefined = content[index]
    const next = content[index + 1]

    const text = textContent(node)

    // Is this the first node and does it want to be the work's title?
    if (
      work.title === undefined &&
      index === 0 &&
      // Only assume title if it is a level 1 heading. Consider a Markdown
      // document that starts with a levels 2 heading (it's probably not the title).
      ((schema.isA('Heading', node) && node.depth === 1) ||
        (schema.isA('Paragraph', node) &&
          (hasStyle(node, titleStyles), isEmphasis(node) || isStrong(node))))
    ) {
      // Title becomes content of the block content node
      work = {
        ...work,
        title: removeMark(node.content),
      }

      node = undefined
    }

    // Is this the authors list paragraph?
    else if (
      work.authors === undefined &&
      newContent.length === 0 &&
      schema.isA('Paragraph', node) &&
      node.content.filter(schema.isType('Superscript')).length > 0
    ) {
      const affiliations = new Map<schema.Person, string[]>()

      const parsed = await Promise.all(
        text.split(/\s*,\s*/).map(async (authorText) => {
          authorText = authorText.trim()
          // If the text end in a number, assume that is the superscripted
          // affiliation and split it off.
          let orgId
          if (/\d$/.test(authorText)) {
            orgId = authorText.slice(-1)
            authorText = authorText.slice(0, -1)
          }
          // Spread the person to allow it us to update it's affiliations below.
          const { ...person } = await decodePerson(authorText)
          if (orgId !== undefined) affiliations.set(person, [orgId])
          return person
        }),
      )

      const authors = parsed.filter(
        (person) => person.familyNames !== undefined,
      )

      if (authors.length > 0) {
        // Look ahead for following affiliations paragraphs that begin with
        // a number.
        let step = 1
        while (true) {
          const following = content[index + step]
          const followingText = textContent(following)
          const match = /^(\d+)\s+(.*)/.exec(followingText)
          if (match) {
            const [orgId, name] = match.slice(1)
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

      let remove = false
      if (work.keywords === undefined && name === 'keywords') {
        work = {
          ...work,
          keywords: value.split(/\s*,|;\s*/).map((keyword) => keyword.trim()),
        }
        remove = true
      }

      if (remove) node = undefined
    }

    // Is this an empty `Paragraph`, `Heading`, or other block node
    else if (
      (schema.isA('Paragraph', node) || schema.isA('Heading', node)) &&
      node.content.length === 0
    ) {
      node = undefined
    }

    // Is this a `Heading 1` disguised as a `Paragraph` with only bold text
    else if (
      schema.isA('Paragraph', node) &&
      node.content.length === 1 &&
      schema.isA('Strong', node.content[0]) &&
      !schema.isA('Figure', prev) &&
      !schema.isA('Table', next)
    ) {
      const bolded = node.content[0]
      if (!/^(Figure|Table|Note)\b/i.test(textContent(bolded))) {
        node = schema.heading({ content: bolded.content, depth: 1 })
      }
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

    // Is this a `CodeChunk` in search of a caption?
    else if (schema.isA('CodeChunk', node) && node.caption === undefined) {
      let captionPara: schema.Paragraph | undefined
      const captionRegex = /^(Figure|Table)\s+\d+\s*[.:]/i
      if (
        schema.isA('Paragraph', prev) &&
        (captionRegex.test(textContent(prev)) ||
          hasStyle(prev, chunkCaptionStyles) ||
          isEmphasis(prev) ||
          isStrong(prev))
      ) {
        // Make previous paragraph the table caption
        captionPara = prev
        newContent.pop()
      } else if (
        schema.isA('Paragraph', next) &&
        (captionRegex.test(textContent(next)) ||
          hasStyle(next, chunkCaptionStyles) ||
          isEmphasis(next) ||
          isStrong(next))
      ) {
        // Make the next paragraph the table caption
        captionPara = next
        index++
      }

      // Separate figure label and caption
      const [label, caption] = separateLabelCaption(captionPara, 'Table|Figure')

      node = {
        ...node,
        label: label ?? node.label,
        caption: caption ?? node.caption,
      }
    }

    // Is this a `Figure` disguised as a `Paragraph` with a single media object in it?
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

      // Only make into a figure if a caption was found
      if (captionPara) {
        // Separate figure label and caption
        const [label, caption] = separateLabelCaption(captionPara, 'Figure')

        // Transform into a Figure
        node = schema.figure({
          content: node.content,
          label,
          caption,
        })
      }
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
          const match =
            /\b((DOI\s*:?\s*)|(https?:\/\/doi\.org\/))?(10.\d{4,9}\/[^\s]+)/i.exec(
              text,
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
            ...((await Promise.all(promises)) as schema.CreativeWork[]),
          )
          promises = []
        }
      }

      // Resolve remaining promises
      references.push(
        ...((await Promise.all(promises)) as schema.CreativeWork[]),
      )

      // Give references an id if they do not already have one
      let ref = 1
      for (const reference of references) {
        if (
          schema.isA('CreativeWork', reference) &&
          reference.id === undefined
        ) {
          reference.id = `ref${ref}`
        }
        ref += 1
      }

      work.references = references

      node = undefined
      index += step - 1
    }

    // TODO Remove this ts-ignore
    // @ts-ignore
    if (node !== undefined) newContent.push(node)
  }

  work.content = newContent.length > 0 ? newContent : undefined

  if (reshapeCites) {
    const { references } = work
    if (references !== undefined) {
      transformSync(work, (node): schema.Node => {
        if (
          schema.isEntity(node) &&
          hasContent(node) &&
          isInlineContentArray(node.content)
        ) {
          const content = node.content
          node.content = decodeNumericCites(content, references)
          node.content = groupCitesIntoCiteGroup(content)
        }
        return node
      })
    }
  }

  return work
}

/**
 * Get the text content of a node.
 *
 * This is similar to `TxtCodec.stringify` but does not
 * stringify arbitrary properties e.g a heading `depth`,
 * it only shows what is "visible".
 *
 * Trims whitespace leading and trailing whitespace.
 * This is particularly useful to avoid have to allow
 * for leading whitespace in regexes.
 */
function textContent(node: schema.Node): string {
  function getTextContent(node: schema.Node): string {
    if (node === undefined || node === null) return ''
    if (typeof node === 'string') return node
    if (Array.isArray(node)) return node.map(getTextContent).join(' ')
    if (typeof node === 'object') {
      if ('text' in node && typeof node.text === 'string') return node.text
      if ('content' in node && Array.isArray(node.content))
        return node.content.map(getTextContent).join('')
      if ('items' in node && Array.isArray(node.items))
        return node.items.map(getTextContent).join(' ')
    }
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    return node.toString()
  }
  return getTextContent(node).trim()
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

/**
 * Remove a mark (e.g. `Emphasis`) from some inline content.
 *
 * This in often used because the mark is not longer needed after it
 * has been used for semantic inference. e.g. when a bold paragraph
 * after a figure is inferred to be a figure caption, we no longer
 * need it to be bolded.
 */
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
  type = 'Figure|Table',
): [string | undefined, [schema.Paragraph] | undefined] {
  if (caption === undefined) return [undefined, undefined]

  // De-emphasize the caption if necessary
  let content = removeMark(caption.content)

  // Attempt to get label and remove it from the caption
  let label: string | undefined
  const first = content[0]
  if (typeof first === 'string') {
    const match = new RegExp(
      '^\\s*(' + type + '\\s*\\d+)\\s*[.:;]?\\s(.*)',
    ).exec(first)
    if (match) {
      label = match[1]
      content = [match[2], ...content.slice(1)]
    }
  }
  return [label, [schema.paragraph({ ...removeStyle(caption), content })]]
}

/**
 * Scan paragraphs for citations and reshape them into `CiteGroup` nodes
 * that link to references
 *
 * Splits string content into `[string, CiteGroup, string]`.
 * At present, detects "[12]" and "[7,8]" style citations in string inline content
 * (ie. will ignore Superscripts, Links etc)
 *
 * @param para  The paragraph to reshape
 * @param references  The reference to link to
 */
function decodeNumericCites(
  content: schema.InlineContent[],
  references: Exclude<schema.CreativeWork['references'], undefined>,
): schema.InlineContent[] {
  return content.reduce(
    (prev: schema.InlineContent[], curr): schema.InlineContent[] => {
      if (typeof curr === 'string') {
        const parts = []
        let last = 0
        // Only match square brackets if preceding space
        const regex = /(?<=\s)\[(\d+)(?:\s*,\s*(\d+))*\]/g
        let match
        while ((match = regex.exec(curr))) {
          // Try to convert each number into a Cite
          const items = match
            .slice(1)
            .filter((digits) => digits !== undefined)
            .map((digits) => {
              const num = parseInt(digits)

              // Get generate an id for the reference
              const ref = references[num - 1]
              let id = `ref${num}`
              if (schema.isIn('CreativeWorkTypes', ref)) {
                if (ref.id !== undefined) id = ref.id
                else ref.id = id
              }

              return schema.cite({ target: id })
            })

          // Split into [string, CiteGroup] parts
          parts.push(curr.slice(last, match.index), schema.citeGroup({ items }))

          last = match.index + match[0].length
        }
        parts.push(curr.slice(last))
        return [...prev, ...parts]
      } else return [...prev, curr]
    },
    [],
  )
}

/**
 * Group `Cite` nodes into `CiteGroup` nodes
 *
 * A single `Cite` surrounded in parentheses (or square brackets)
 * will be made `Parenthetical` but will not be put into a single item
 * `CiteGroup`.
 *
 * @param para The paragraph to reshape
 */
export function groupCitesIntoCiteGroup(
  content: schema.InlineContent[],
): schema.InlineContent[] {
  content = [...content]

  for (let index = 0; index < content.length; index++) {
    const curr = content[index]
    if (typeof curr === 'string') {
      for (const [startDelim, endDelim] of [
        ['(', ')'],
        ['[', ']'],
      ]) {
        if (!curr.endsWith(startDelim)) continue

        let group: schema.CiteGroup | undefined
        let items: schema.Cite[] = []
        let ahead = 1
        while (index + ahead < content.length) {
          const node = content[index + ahead]
          if (schema.isA('CiteGroup', node) && group === undefined) {
            group = node
          } else if (schema.isA('Cite', node)) {
            // Make sure that this cite does not have a narrative `citationMode`
            // (parenthetical is the default so set to `undefined`)
            node.citationMode = undefined
            // Collect into cite items
            items = [...items, node]
          } else if (typeof node === 'string') {
            if (node.startsWith(endDelim)) {
              // Matching closing parenthesis so make modifications
              // to content
              content[index] = curr.slice(0, -1)
              content[index + ahead] = node.slice(1)
              content.splice(
                index + 1, // start
                ahead - 1, // items to delete
                // item to insert...
                group ??
                  (items.length === 1
                    ? items[0] // only cite
                    : schema.citeGroup({ items })), // group cites together
              )

              // Skip ahead one so we don't bother looking at the
              // CiteGroup that was just inserted
              index += 1
              break
            } else if (/\s*,|;\s*/.test(node)) {
              // Ignore separators
            } else {
              // Some other text between Cite nodes so exit
              break
            }
          } else {
            // Some other, non matching content so exit
            break
          }
          ahead++
        }
      }
    }
  }

  return content
}

// Just-in-time instantiated codecs.
// These need to be dynamically imported due to circular imports.
let personCodec: unknown
let doiCodec: unknown
let crossrefCodec: unknown

/* eslint-disable */
// Due to the use of dynamic imports many un-useful eslint warnings below

/**
 * Decode a string to a `Person`.
 */
function decodePerson(text: string): Promise<schema.Person> {
  if (personCodec === undefined) {
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
  text: string,
): Promise<schema.CreativeWork | string> {
  if (doiCodec === undefined) {
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

/* eslint-enable */
