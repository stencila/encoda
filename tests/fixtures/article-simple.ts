import { Article } from '@stencila/schema'

// A very simple Article with only headings and paragraphs
const article: Article = {
  type: 'Article',
  authors: [],
  content: [
    {
      type: 'Heading',
      depth: 1,
      content: ['Heading one']
    },
    {
      type: 'Heading',
      depth: 2,
      content: ['Heading two']
    },
    {
      type: 'Heading',
      depth: 3,
      content: ['Heading three']
    },
    {
      type: 'Paragraph',
      content: ['Paragraph.']
    }
  ]
}
export default article
