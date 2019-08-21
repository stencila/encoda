# Test fixtures for the `jsonld` codec

Note that there may be another codec that specifically deals with each of these types of data e.g. `orcid` for JSON-LD from ORCID. Here, they are just being used as data sources to provide fixtures for the `jsonld` codec.

## ORCID

[ORCID](https://orcid.org) returns JSON-LD for a `Person`:

```bash
http --follow https://orcid.org/0000-0002-1825-0097 Accept:application/ld+json > orci
d.jsonld
```

## DataCite

Martin Fenner's [article](https://blog.datacite.org/schema-org-register-dois/) as JSON-LD:

```bash
http --follow https://doi.org/10.5438/0000-00cc Accept:application/vnd.schemaorg.ld+json > datacite.jsonld
```

## Schema.org

Examples taken from schema.org:

`image.jsonld`: https://schema.org/PropertyValue
