import { BlockContent, InlineContent, Paragraph } from '@stencila/schema'
import { ensureBlockContent } from './ensureBlockContent'

const primitives = [null, true, false, NaN, 2, 'string']

describe('Wrap In Block Node', () => {
  const blockNode: BlockContent = {
    type: 'Paragraph',
    content: [],
  }

  const inlineNode: InlineContent = {
    type: 'CodeExpression',
    text: '1+2',
  }

  test('it returns a given BlockContent node', () => {
    expect(ensureBlockContent(blockNode)).toEqual(blockNode)
  })

  test('it wraps an inlineContent in a Paragraph', () => {
    ;[...primitives, inlineNode].map((node) => {
      const actual = ensureBlockContent(node)
      expect(actual).toHaveProperty('type', 'Paragraph')
    })
  })

  test('returned element contains the inlineContent', () => {
    const actual = ensureBlockContent(inlineNode) as Paragraph
    expect(actual.content).toContain(inlineNode)
  })
})
