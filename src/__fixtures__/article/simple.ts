import { article, heading, paragraph } from '@stencila/schema'

/**
 * A very simple `Article` with only headings, paragraphs
 */
export default article({
  content: [
    heading({
      depth: 1,
      content: ['Heading one'],
    }),
    heading({
      depth: 2,
      content: ['Heading two'],
    }),
    paragraph({
      content: ['Paragraph one.'],
    }),
    heading({
      depth: 3,
      content: ['Heading three'],
    }),
    paragraph({
      content: ['Paragraph two.'],
    }),
  ],
})
