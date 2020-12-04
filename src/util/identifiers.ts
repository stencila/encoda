/**
 * Encode the name of an identifier type to a URI for use on
 * a `propertyID` property.
 *
 * See [this](https://github.com/ESIPFed/science-on-schema.org/issues/13#issuecomment-577446582)
 * which recommends:
 *
 *   > a schema:propertyId for each identifier that links back to the identifier scheme using
 *   > URIs drawn from the http://purl.org/spar/datacite/IdentifierScheme vocabulary or from
 *   > identifiers.org registered prefixes from https://registry.identifiers.org/registry
 */
export function encodeIdentifierTypeUri(name?: string): string | undefined {
  if (name === undefined) return undefined
  return `https://registry.identifiers.org/registry/${name}`
}
