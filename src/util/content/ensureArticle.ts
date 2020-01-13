import stencila from '@stencila/schema'
import { ensureBlockContent } from './ensureBlockContent';

/**
 * Ensure that a node is an `Article` by wrapping a non-article
 * node if necessary.
 */
export const ensureArticle = (
  node: stencila.Node
): stencila.Article => {
  return stencila.isArticle(node)
    ? node
    : stencila.article([], '', {content: [ensureBlockContent(node)]})
}
