export const isDefined = <T>(n: T): n is NonNullable<typeof n> => n != null

export const reduceNonNullable = <A, B>(callback: (sourceNode: A) => B) => (
  convertedNodes: NonNullable<B>[] = [],
  sourceNode?: A
): NonNullable<B>[] => {
  const decodedNode = sourceNode ? callback(sourceNode) : undefined
  return isDefined(decodedNode)
    ? [...convertedNodes, decodedNode]
    : convertedNodes
}

/**
 * Removes all properties that are undefined from a given object.
 * Note that `null` values are considered explicit falsy values, and are not removed.
 */
export const compactObj = <O extends object>(o: O): O => {
  return Object.entries(o).reduce(
    (compacted: O, [k, v]) => {
      return v !== undefined ? { ...compacted, [k]: v } : compacted
    },
    {} as O // eslint-disable-line
  )
}
